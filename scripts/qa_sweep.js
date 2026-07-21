import puppeteer from 'puppeteer';
import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

const targetSlug = process.argv[2];

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

const pages = targetSlug ? findHtmlFiles('sites') : ['index.html', ...findHtmlFiles('sites')];
const baseUrl = 'http://localhost:4173/';
const results = [];
const outDir = './qa-screenshots';

if (!existsSync(outDir)) mkdirSync(outDir);

const waitForServer = async (url, timeout = 15000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) { /* ignore and poll */ }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Server did not start at ${url}`);
};

(async () => {
  let server;
  let browser;

  try {
    console.log('Starting preview server...');
    // Note: Using cross-platform friendly command for Windows
    server = spawn('npm', ['run', 'preview'], { shell: true, stdio: 'ignore' });

    await waitForServer(baseUrl);
    console.log('Server is ready.');

    // Default headless for CI/automation. Visual mode: QA_HEADED=1 npm run qa
    const headed = process.env.QA_HEADED === '1' || process.env.QA_HEADED === 'true';
    console.log(`Launching browser (${headed ? 'headed' : 'headless'})...`);
    browser = await puppeteer.launch({
      headless: headed ? false : true,
      defaultViewport: headed ? null : { width: 1440, height: 900 },
    });

    for (const pagePath of pages) {
      console.log(`\nChecking ${pagePath}...`);
      const url = pagePath === 'index.html' ? baseUrl : `${baseUrl}${pagePath}`;
      const pageResult = { path: pagePath, mobile: {}, desktop: {} };

      const page = await browser.newPage();

      // Track Network & Console Errors
      const consoleErrors = [];
      const networkErrors = [];

      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      page.on('response', response => {
        if (!response.ok() && response.status() >= 400 && response.url().startsWith(baseUrl)) {
          networkErrors.push(`${response.status()} - ${response.url()}`);
        }
      });

      try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        const checkViewport = async (width, height, label) => {
          await page.setViewport({ width, height });

          // Force-load lazy images
          await page.evaluate(async () => {
            const withTimeout = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]);
            const imgs = [...document.images];
            for (const img of imgs) {
              if (img.loading === 'lazy') img.loading = 'eager';
              if (!img.complete) {
                await withTimeout(new Promise((resolve) => {
                  img.addEventListener('load', resolve, { once: true });
                  img.addEventListener('error', resolve, { once: true });
                }), 8000);
              }
              try { await withTimeout(img.decode(), 4000); } catch { }
            }
          });

          // Visual Inspection Scroll
          const scrollHeight = await page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
          for (let pos = 0; pos < scrollHeight; pos += height) {
            await page.evaluate((p) => window.scrollTo(0, p), pos);
            await new Promise(r => setTimeout(r, 150));
          }
          await page.evaluate(() => window.scrollTo(0, 0));
          await new Promise(r => setTimeout(r, 200));

          // Granular Overflow Detection
          const overflowingElements = await page.evaluate(() => {
            const docWidth = document.documentElement.clientWidth;
            return [...document.querySelectorAll('*')]
              .filter(el => {
                const rect = el.getBoundingClientRect();
                if (rect.right <= docWidth + 1) return false; // +1 for subpixel rounding
                
                // Check if safely contained in a scrolling/clipped parent
                let parent = el.parentElement;
                while (parent && parent !== document.body && parent !== document.documentElement) {
                  const style = window.getComputedStyle(parent);
                  if (['hidden', 'auto', 'scroll', 'clip'].includes(style.overflowX)) {
                    const parentRect = parent.getBoundingClientRect();
                    // If the parent itself is within bounds, the child's overflow is safely contained
                    if (parentRect.right <= docWidth + 1) {
                      return false;
                    }
                  }
                  parent = parent.parentElement;
                }
                return true;
              })
              .map(el => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ').join('.') : ''}`);
          });

          // Asset validation
          const brokenImages = await page.evaluate(() =>
            [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src)
          );

          const missingAltTags = await page.evaluate(() =>
            [...document.images].filter(i => !i.hasAttribute('alt')).map(i => i.src)
          );

          // Deep WebP check (includes <picture> and srcset)
          const nonWebpPhotos = await page.evaluate(() => {
            const getSrc = (el) => el.getAttribute('src') || el.getAttribute('srcset') || '';
            const elements = [...document.querySelectorAll('img[src], source[srcset]')];
            return elements
              .map(getSrc)
              .filter(src => src && !/\.webp(\?|$)/i.test(src) && !/\.svg(\?|$)/i.test(src) && !src.startsWith('data:image/') && !/favicon/i.test(src));
          });

          // Link Sweeper (Internal links only, to avoid external CORS/Timeout issues)
          const brokenLinks = [];
          const links = await page.evaluate(() => [...document.querySelectorAll('a')].map(a => a.href));
          const uniqueInternalLinks = [...new Set(links)].filter(link => link.startsWith(baseUrl));

          for (const link of uniqueInternalLinks) {
            try {
              const res = await fetch(link, { method: 'HEAD' });
              if (!res.ok) brokenLinks.push(link);
            } catch (e) {
              brokenLinks.push(link);
            }
          }

          await page.screenshot({ path: `${outDir}/${pagePath.replace(/\//g, '_')}_${label}.png`, fullPage: true });

          return {
            overflowingElements,
            brokenImages,
            missingAltTags,
            nonWebpPhotos,
            consoleErrors: [...consoleErrors],
            networkErrors: [...networkErrors],
            brokenLinks
          };
        };

        pageResult.mobile = await checkViewport(390, 844, 'mobile');

        // Reset errors before desktop check
        consoleErrors.length = 0;
        networkErrors.length = 0;

        pageResult.desktop = await checkViewport(1440, 900, 'desktop');

      } catch (err) {
        console.error(`Error processing ${pagePath}:`, err);
        pageResult.error = err.message;
      }

      results.push(pageResult);
      await page.close();
    }

    writeFileSync('qa-report.json', JSON.stringify(results, null, 2));
    console.log('\nQA sweep complete! Saved to qa-report.json');

    // Strict Failure Checking
    const failures = results.filter((r) => {
      const m = r.mobile || {};
      const d = r.desktop || {};
      const hasIssues = (view) =>
        (view.overflowingElements?.length) ||
        (view.brokenImages?.length) ||
        (view.nonWebpPhotos?.length) ||
        (view.consoleErrors?.length) ||
        (view.networkErrors?.length) ||
        (view.brokenLinks?.length);

      return r.error || hasIssues(m) || hasIssues(d);
    });

    if (failures.length) {
      console.error(`\nQA FAIL: ${failures.length} page(s) with issues. Check qa-report.json for details.`);
      process.exitCode = 1; // Mark as failed instead of immediate exit to allow `finally` block to run
    }

  } catch (globalError) {
    console.error('Fatal QA Error:', globalError);
    process.exitCode = 1;
  } finally {
    // Guaranteed Teardown (Crucial for Windows 11 / MSI setups)
    if (browser) await browser.close();
    if (server) {
      // Windows sometimes requires specific kill signals for npm child processes
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', server.pid, '/f', '/t']);
      } else {
        server.kill();
      }
    }
    process.exit();
  }
})();
