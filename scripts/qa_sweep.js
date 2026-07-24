#!/usr/bin/env node
/**
 * Puppeteer QA sweep against Vite preview (dist/).
 * Usage: node scripts/qa_sweep.js [slug] [--no-screenshots] [--no-hub] [--concurrency N]
 * Env: QA_HEADED=1 for headed browser; CI=true implies --no-screenshots.
 * npm: npm run qa -- <slug>
 */
import puppeteer from 'puppeteer';
import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

function parseArgs(argv) {
  const flags = {
    slug: null,
    noScreenshots: process.env.CI === 'true',
    noHub: false,
    concurrency: null,
  };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-screenshots') flags.noScreenshots = true;
    else if (a === '--no-hub') flags.noHub = true;
    else if (a === '--concurrency') {
      flags.concurrency = Number(argv[++i]);
    } else if (a.startsWith('--')) {
      console.error(`Unknown flag: ${a}`);
      console.error('Usage: node scripts/qa_sweep.js [slug] [--no-screenshots] [--no-hub] [--concurrency N]');
      process.exit(2);
    } else {
      positional.push(a);
    }
  }
  if (positional[0]) flags.slug = positional[0];
  return flags;
}

const opts = parseArgs(process.argv.slice(2));
const targetSlug = opts.slug;
const baseUrl = 'http://127.0.0.1:4173/';
const outDir = './qa-screenshots';

function findHtmlFiles(dir, fileList = []) {
  const files = readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      if (targetSlug && dir === 'sites' && file.name !== targetSlug) continue;
      findHtmlFiles(join(dir, file.name), fileList);
    } else if (file.name.endsWith('.html')) {
      fileList.push(join(dir, file.name).replace(/\\/g, '/'));
    }
  }
  return fileList;
}

const sitePages = findHtmlFiles('sites');
const pages =
  targetSlug && opts.noHub
    ? sitePages
    : targetSlug
      ? ['index.html', ...sitePages]
      : ['index.html', ...sitePages];

function viewHasIssues(view) {
  if (!view) return false;
  return Boolean(
    view.overflowingElements?.length ||
      view.brokenImages?.length ||
      view.nonWebpPhotos?.length ||
      view.missingAltTags?.length ||
      view.missingFavicon?.length ||
      view.consoleErrors?.length ||
      view.networkErrors?.length ||
      view.brokenLinks?.length
  );
}

function pageFailed(r) {
  return Boolean(r.error || viewHasIssues(r.mobile) || viewHasIssues(r.desktop));
}

function accumulateCounts(pagesList) {
  const counts = {
    overflow: 0,
    brokenImages: 0,
    nonWebpPhotos: 0,
    missingAltTags: 0,
    consoleErrors: 0,
    networkErrors: 0,
    brokenLinks: 0,
  };
  for (const r of pagesList) {
    for (const view of [r.mobile, r.desktop]) {
      if (!view) continue;
      counts.overflow += view.overflowingElements?.length || 0;
      counts.brokenImages += view.brokenImages?.length || 0;
      counts.nonWebpPhotos += view.nonWebpPhotos?.length || 0;
      counts.missingAltTags += view.missingAltTags?.length || 0;
      counts.missingFavicon += view.missingFavicon?.length || 0;
      counts.consoleErrors += view.consoleErrors?.length || 0;
      counts.networkErrors += view.networkErrors?.length || 0;
      counts.brokenLinks += view.brokenLinks?.length || 0;
    }
  }
  return counts;
}

function truncateSelector(sel, max = 120) {
  if (!sel || sel.length <= max) return sel;
  return `${sel.slice(0, max)}…`;
}

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const n = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

const waitForServer = async (url, timeout = 20000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* poll */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not start at ${url}`);
};

(async () => {
  let server;
  let browser;
  let exitCode = 0;

  try {
    if (!pages.length) {
      console.error('No HTML pages found to check.');
      exitCode = 1;
      return;
    }

    if (!opts.noScreenshots && !existsSync(outDir)) mkdirSync(outDir);

    console.log('\nStarting preview server...');
    server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1'], { shell: true, stdio: 'inherit' });
    await waitForServer(baseUrl);
    console.log('Server is ready. Waiting 2s for stability...');
    await new Promise(r => setTimeout(r, 2000));

    const headed = process.env.QA_HEADED === '1' || process.env.QA_HEADED === 'true';
    const concurrency =
      Number.isFinite(opts.concurrency) && opts.concurrency > 0
        ? opts.concurrency
        : headed
          ? 1
          : 2;

    console.log(
      `Launching browser (${headed ? 'headed' : 'headless'}); concurrency=${concurrency}; screenshots=${opts.noScreenshots ? 'off' : 'on'}; pages=${pages.length}`
    );

    browser = await puppeteer.launch({
      headless: headed ? false : true,
      defaultViewport: headed ? null : { width: 1440, height: 900 },
    });

    async function checkPage(pagePath) {
      console.log(`\nChecking ${pagePath}...`);
      const url = pagePath === 'index.html' ? baseUrl : `${baseUrl}${pagePath}`;
      const pageResult = { path: pagePath, mobile: {}, desktop: {} };
      const page = await browser.newPage();

      const consoleErrors = [];
      const networkErrors = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      page.on('response', (response) => {
        if (!response.ok() && response.status() >= 400 && response.url().startsWith(baseUrl)) {
          networkErrors.push(`${response.status()} - ${response.url()}`);
        }
      });

      try {
        try {
          await page.goto(url, { waitUntil: 'networkidle2' });
        } catch (err) {
          if (err.message.includes('ERR_ABORTED') || err.message.includes('Target closed')) {
            console.warn(`Flaky navigation error on ${url}: ${err.message}. Retrying in 2s...`);
            await new Promise(r => setTimeout(r, 2000));
            await page.goto(url, { waitUntil: 'networkidle2' });
          } else {
            throw err;
          }
        }

        const checkViewport = async (width, height, label, { checkLinks }) => {
          await page.setViewport({ width, height });

          await page.evaluate(async () => {
            const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
            const imgs = [...document.images];
            for (const img of imgs) {
              if (img.loading === 'lazy') img.loading = 'eager';
              if (!img.complete) {
                await withTimeout(
                  new Promise((resolve) => {
                    img.addEventListener('load', resolve, { once: true });
                    img.addEventListener('error', resolve, { once: true });
                  }),
                  8000
                );
              }
              try {
                await withTimeout(img.decode(), 4000);
              } catch {
                /* ignore */
              }
            }
          });

          const scrollHeight = await page.evaluate(() =>
            Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
          );
          for (let pos = 0; pos < scrollHeight; pos += height) {
            await page.evaluate((p) => window.scrollTo(0, p), pos);
            await new Promise((r) => setTimeout(r, 150));
          }
          await page.evaluate(() => window.scrollTo(0, 0));
          await new Promise((r) => setTimeout(r, 200));

          const overflowingElements = (
            await page.evaluate(() => {
              const docWidth = document.documentElement.clientWidth;
              return [...document.querySelectorAll('*')]
                .filter((el) => {
                  const rect = el.getBoundingClientRect();
                  if (rect.right <= docWidth + 1) return false;
                  let parent = el.parentElement;
                  while (parent && parent !== document.body && parent !== document.documentElement) {
                    const style = window.getComputedStyle(parent);
                    if (['hidden', 'auto', 'scroll', 'clip'].includes(style.overflowX)) {
                      const parentRect = parent.getBoundingClientRect();
                      if (parentRect.right <= docWidth + 1) return false;
                    }
                    parent = parent.parentElement;
                  }
                  return true;
                })
                .map((el) => {
                  const cls =
                    typeof el.className === 'string'
                      ? el.className
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 4)
                          .join('.')
                      : '';
                  return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''}`;
                });
            })
          ).map((s) => truncateSelector(s));

          const brokenImages = await page.evaluate(() =>
            [...document.images]
              .filter((i) => i.complete && i.naturalWidth === 0)
              .map((i) => i.src)
              .filter((src) => !src.includes('favicon'))
          );

          const missingAltTags = await page.evaluate(() =>
            [...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => i.src)
          );

          const missingFavicon = await page.evaluate(() => {
            const iconLink = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
            if (!iconLink) return ['No favicon link found'];
            if (!iconLink.href.includes('favicon')) return ['Favicon href invalid'];
            return [];
          });

          const nonWebpPhotos = await page.evaluate(() => {
            const isBadPhoto = (src) =>
              src &&
              !/\.webp(\?|$)/i.test(src) &&
              !/\.svg(\?|$)/i.test(src) &&
              !src.startsWith('data:image/') &&
              !/favicon/i.test(src) &&
              /\.(png|jpe?g|gif|avif|bmp)(\?|$)/i.test(src);

            const fromDom = [...document.querySelectorAll('img[src], source[srcset]')]
              .map((el) => el.getAttribute('src') || el.getAttribute('srcset') || '')
              .flatMap((s) => s.split(',').map((part) => part.trim().split(/\s+/)[0]))
              .filter(isBadPhoto);

            const fromCss = [];
            const urlRe = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
            for (const el of document.querySelectorAll('*')) {
              const bg = window.getComputedStyle(el).backgroundImage;
              if (!bg || bg === 'none') continue;
              let m;
              urlRe.lastIndex = 0;
              while ((m = urlRe.exec(bg)) !== null) {
                if (isBadPhoto(m[1])) fromCss.push(m[1]);
              }
            }
            return [...new Set([...fromDom, ...fromCss])];
          });

          let brokenLinks = [];
          if (checkLinks) {
            const links = await page.evaluate(() => [...document.querySelectorAll('a')].map((a) => a.href));
            const uniqueInternalLinks = [...new Set(links)].filter((link) => link.startsWith(baseUrl));
            for (const link of uniqueInternalLinks) {
              try {
                const res = await fetch(link, { method: 'HEAD' });
                if (!res.ok) brokenLinks.push(link);
              } catch {
                brokenLinks.push(link);
              }
            }
          }

          if (!opts.noScreenshots) {
            await page.screenshot({
              path: `${outDir}/${pagePath.replace(/\//g, '_')}_${label}.png`,
              fullPage: true,
            });
          }

          return {
            overflowingElements,
            brokenImages,
            missingAltTags,
            missingFavicon,
            nonWebpPhotos,
            consoleErrors: [...consoleErrors],
            networkErrors: [...networkErrors],
            brokenLinks,
          };
        };

        pageResult.mobile = await checkViewport(390, 844, 'mobile', { checkLinks: true });
        consoleErrors.length = 0;
        networkErrors.length = 0;
        pageResult.desktop = await checkViewport(1440, 900, 'desktop', { checkLinks: false });
        // Carry link results to desktop view for consistent hasIssues (links checked once)
        pageResult.desktop.brokenLinks = pageResult.mobile.brokenLinks;
      } catch (err) {
        console.error(`Error processing ${pagePath}:`, err);
        pageResult.error = err.message;
      }

      await page.close();
      return pageResult;
    }

    const results = await mapPool(pages, concurrency, checkPage);

    const failed = results.filter(pageFailed);
    const summary = {
      pages: results.length,
      failedPages: failed.length,
      pass: failed.length === 0,
      counts: accumulateCounts(results),
    };

    const report = {
      generatedAt: new Date().toISOString(),
      slugFilter: targetSlug || null,
      summary,
      pages: results,
    };

    writeFileSync('qa-report.json', JSON.stringify(report, null, 2));
    console.log('\nQA sweep complete! Saved to qa-report.json');
    console.log(
      `\n${summary.pass ? 'QA PASS' : 'QA FAIL'}: ${summary.pages - summary.failedPages}/${summary.pages} pages clean`
    );
    console.log('Counts:', JSON.stringify(summary.counts));
    if (failed.length) {
      console.error('Failing pages:', failed.map((f) => f.path).join(', '));
      exitCode = 1;
    }
  } catch (globalError) {
    console.error('Fatal QA Error:', globalError);
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', server.pid, '/f', '/t']);
      } else {
        server.kill();
      }
    }
    process.exit(exitCode);
  }
})();
