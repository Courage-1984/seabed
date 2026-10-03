#!/usr/bin/env node
/**
 * Puppeteer QA sweep against Vite preview (dist/).
 * Usage: node scripts/qa_sweep.js [slug] [--no-screenshots] [--no-hub]
 *                                 [--concurrency N] [--devices core|fast|<keys>] [--full-dpr]
 * Env: QA_HEADED=1 for headed browser; CI=true implies --no-screenshots.
 * npm: npm run qa -- <slug>
 *
 * Every device gets its own navigation. The sweep used to load once and then
 * call setViewport(), so the "mobile" numbers were measured against JS that
 * had initialised at 1440x900 — see scripts/lib/device-matrix.js.
 */
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { readdirSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { resolveSlugPath, findAllSiteDirs } from './lib/resolve-slug.js';
import { resolveDevices, applyDevice, describeDevice } from './lib/device-matrix.js';
import { pageFailed, accumulateCounts, failingDevices } from './lib/qa-verdict.js';
import { siteSourceDigest, distDigest } from './lib/source-digest.js';
import {
  PREVIEW_URL,
  mapPool,
  startPreviewServer,
  stopPreviewServer,
} from './lib/preview-server.js';

function parseArgs(argv) {
  const flags = {
    slug: null,
    noScreenshots: process.env.CI === 'true',
    noHub: false,
    concurrency: null,
    devices: 'core',
    fullDpr: false,
  };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-screenshots') flags.noScreenshots = true;
    else if (a === '--no-hub') flags.noHub = true;
    else if (a === '--concurrency') {
      flags.concurrency = Number(argv[++i]);
    } else if (a === '--devices') {
      flags.devices = argv[++i];
    } else if (a === '--full-dpr') {
      flags.fullDpr = true;
    } else if (a.startsWith('--')) {
      console.error(`Unknown flag: ${a}`);
      console.error(
        'Usage: node scripts/qa_sweep.js [slug] [--no-screenshots] [--no-hub] [--concurrency N] [--devices core|fast|<keys>] [--full-dpr]'
      );
      process.exit(2);
    } else {
      positional.push(a);
    }
  }
  if (positional[0]) flags.slug = positional[0];
  return flags;
}

const opts = parseArgs(process.argv.slice(2));
let devices;
try {
  devices = resolveDevices(opts.devices, { fullDpr: opts.fullDpr });
} catch (err) {
  console.error(err.message);
  process.exit(2);
}
const targetSlug = opts.slug;
const baseUrl = PREVIEW_URL;
const outDir = './qa-screenshots';
const ROOT = resolve('.');

function findHtmlFiles(dir, fileList = []) {
  if (!existsSync(dir)) return fileList;
  const files = readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      findHtmlFiles(join(dir, file.name), fileList);
    } else if (file.name.endsWith('.html')) {
      fileList.push(join(dir, file.name).replace(/\\/g, '/'));
    }
  }
  return fileList;
}

let searchDir = 'sites';
if (targetSlug) {
  const resolvedSite = resolveSlugPath(ROOT, targetSlug);
  if (!resolvedSite) {
    console.error(`QA Sweep error: site not found for slug "${targetSlug}"`);
    process.exit(1);
  }
  searchDir = resolvedSite.relativePath;
}

const sitePages = findHtmlFiles(searchDir);
const pages =
  targetSlug && opts.noHub ? sitePages : targetSlug ? ['index.html', ...sitePages] : ['index.html', ...sitePages];

function truncateSelector(sel, max = 120) {
  if (!sel || sel.length <= max) return sel;
  return `${sel.slice(0, max)}…`;
}

async function runStaticChecks(url) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const missingAltTags = [];
  $('img:not([alt])').each((_, el) => {
    missingAltTags.push($(el).attr('src') || 'unknown');
  });

  const missingFavicon = [];
  const iconLink = $('link[rel="icon"], link[rel="shortcut icon"]');
  if (iconLink.length === 0) {
    missingFavicon.push('No favicon link found');
  } else {
    const href = iconLink.attr('href');
    if (!href || !href.includes('favicon')) {
      missingFavicon.push('Favicon href invalid');
    } else {
      try {
        const fetchHref = new URL(href, url).href;
        const iconRes = await fetch(fetchHref);
        if (!iconRes.ok) {
          missingFavicon.push(`Favicon HTTP ${iconRes.status}`);
        } else {
          const text = await iconRes.text();
          if (href.endsWith('.svg') || iconLink.attr('type') === 'image/svg+xml') {
            if (!text.includes('<svg')) missingFavicon.push('Favicon is not a valid SVG');
            if (text.includes('xmlns="http://www.svg.org/2000/svg"'))
              missingFavicon.push('Favicon SVG has invalid xmlns (svg.org instead of w3.org)');
          }
        }
      } catch (e) {
        missingFavicon.push(`Favicon fetch failed: ${e.message}`);
      }
    }
  }

  const isBadPhoto = (src) =>
    src &&
    !/\.webp(\?|$)/i.test(src) &&
    !/\.svg(\?|$)/i.test(src) &&
    !src.startsWith('data:image/') &&
    !/favicon/i.test(src) &&
    /\.(png|jpe?g|gif|avif|bmp)(\?|$)/i.test(src);

  const nonWebpPhotos = [];
  $('img[src], source[srcset]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('srcset') || '';
    src.split(',').forEach((part) => {
      const pUrl = part.trim().split(/\s+/)[0];
      if (isBadPhoto(pUrl)) nonWebpPhotos.push(pUrl);
    });
  });

  const urlRe = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
  $('*[style*="background"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    let m;
    urlRe.lastIndex = 0;
    while ((m = urlRe.exec(style)) !== null) {
      if (isBadPhoto(m[1])) nonWebpPhotos.push(m[1]);
    }
  });

  // Extract links for broken links check (can also be done here or in Puppeteer)
  // Let's keep brokenLinks in Puppeteer as it was, but we can do it here too if we want.
  // We'll leave brokenLinks in Puppeteer for now, since it checks relative to the page.
  return {
    missingAltTags,
    missingFavicon,
    nonWebpPhotos: [...new Set(nonWebpPhotos)],
  };
}

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

    // Remove any previous report before doing anything. A crashed run used to
    // leave the last run's file sitting there, and anything reading it next --
    // check:ship, a batch runner -- would treat another site's results as this
    // site's. Absence is honest; a stale file is not.
    rmSync(join(ROOT, 'qa-report.json'), { force: true });

    if (!opts.noScreenshots && !existsSync(outDir)) mkdirSync(outDir);

    console.log('\nStarting preview server...');
    server = await startPreviewServer();
    console.log('Server is ready.');

    const headed = process.env.QA_HEADED === '1' || process.env.QA_HEADED === 'true';
    const onCi = process.env.CI === 'true';
    const concurrency =
      Number.isFinite(opts.concurrency) && opts.concurrency > 0 ? opts.concurrency : headed || onCi ? 1 : 2;

    console.log(
      `Launching browser (${headed ? 'headed' : 'headless'}); concurrency=${concurrency}; screenshots=${opts.noScreenshots ? 'off' : 'on'}; pages=${pages.length}`
    );
    console.log(`Devices (${devices.length}): ${devices.map(describeDevice).join(', ')}`);

    browser = await puppeteer.launch({
      headless: headed ? false : true,
      defaultViewport: headed ? null : { width: 1440, height: 900 },
      // Hub + many site cards can keep evaluate() busy longer than the 180s default.
      protocolTimeout: 300_000,
      // GitHub Actions / container runners need sandbox disabled for Chrome.
      args: onCi ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
    });

    // Captured once so applyDevice() can reset the UA after a phone; without
    // it every desktop device inherits whichever mobile UA ran last.
    const defaultUserAgent = await browser.userAgent();

    async function checkPage(pagePath) {
      console.log(`\nChecking ${pagePath}...`);
      const url = pagePath === 'index.html' ? baseUrl : `${baseUrl}${pagePath}`;
      const pageResult = { path: pagePath, views: {} };

      const staticResults = await runStaticChecks(url);

      const page = await browser.newPage();

      const consoleErrors = [];
      const networkErrors = [];
      const pageErrors = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      // An uncaught exception that logs nothing was invisible before. It
      // matters here because these sites hide sections behind a JS reveal —
      // one throw in a DOMContentLoaded handler leaves a whole section blank
      // with a clean console.
      page.on('pageerror', (err) => {
        pageErrors.push(String(err?.message || err));
      });

      page.on('response', (response) => {
        if (!response.ok() && response.status() >= 400 && response.url().startsWith(baseUrl)) {
          networkErrors.push(`${response.status()} - ${response.url()}`);
        }
      });

      // The hub lists every site and runs past 40,000px on mobile, so it can
      // exceed the 30s default while the rest of the sweep holds the CPU.
      const NAV_TIMEOUT_MS = 90_000;

      const navigate = async () => {
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT_MS });
        } catch (err) {
          const retryable =
            err.message.includes('ERR_ABORTED') ||
            err.message.includes('Target closed') ||
            err.message.includes('Navigation timeout');
          if (retryable) {
            console.warn(`Flaky navigation error on ${url}: ${err.message}. Retrying in 2s...`);
            await new Promise((r) => setTimeout(r, 2000));
            await page.goto(url, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT_MS });
          } else {
            throw err;
          }
        }
      };

      try {
        const checkViewport = async (device, { checkLinks }) => {
          const label = device.key;
          const height = device.viewport.height;

          // Emulate, then load. Resizing a live page leaves any width-sensitive
          // JS holding the measurements it took at the previous size, which is
          // exactly how a broken mobile layout passed this sweep.
          await applyDevice(page, device, defaultUserAgent);
          consoleErrors.length = 0;
          networkErrors.length = 0;
          pageErrors.length = 0;
          await navigate();

          // Parallel + overall budget — sequential per-image waits on the hub
          // (34+ cards) can exceed Puppeteer's protocolTimeout under CI load.
          await page.evaluate(async () => {
            const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
            const imgs = [...document.images];
            for (const img of imgs) {
              if (img.loading === 'lazy') img.loading = 'eager';
            }
            await withTimeout(
              Promise.all(
                imgs.map(async (img) => {
                  if (!img.complete) {
                    await withTimeout(
                      new Promise((resolve) => {
                        img.addEventListener('load', resolve, { once: true });
                        img.addEventListener('error', resolve, { once: true });
                      }),
                      3000
                    );
                  }
                  try {
                    await withTimeout(img.decode(), 2000);
                  } catch {
                    /* ignore */
                  }
                })
              ),
              25000
            );
          });

          const scrollHeight = await page.evaluate(() =>
            Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
          );
          const maxScrollSteps = 40;
          let steps = 0;
          for (let pos = 0; pos < scrollHeight && steps < maxScrollSteps; pos += height, steps++) {
            await page.evaluate((p) => window.scrollTo(0, p), pos);
            await new Promise((r) => setTimeout(r, 100));
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
                      ? el.className.split(/\s+/).filter(Boolean).slice(0, 4).join('.')
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

          const visualIssues = await page.evaluate(() => {
            const issues = {
              overlappingText: [],
              smallFonts: [],
              repetitiveLayout: false
            };
            
            const elements = [...document.body.querySelectorAll('*')];
            let split5050Count = 0;

            for (const el of elements) {
              const style = window.getComputedStyle(el);
              if (style.display === 'none' || style.visibility === 'hidden') continue;
              
              const fontSize = parseFloat(style.fontSize);
              
              // Only check font size if this element directly contains text (not just child elements)
              let hasDirectText = false;
              for (const node of el.childNodes) {
                if (node.nodeType === 3 && node.nodeValue.trim().length > 0) {
                  hasDirectText = true;
                  break;
                }
              }

              if (fontSize > 0 && fontSize < 12 && hasDirectText) {
                issues.smallFonts.push(el.tagName.toLowerCase());
              }

              // Screen-reader-only text is clipped on purpose (1px box + clip-path
              // or the legacy clip rect), so it must not read as truncated content.
              const rect = el.getBoundingClientRect();
              const srOnly =
                rect.width <= 2 &&
                rect.height <= 2 &&
                ((style.clipPath && style.clipPath !== 'none') || (style.clip && style.clip !== 'auto'));

              // Overlap check: only check elements with direct text that are constrained
              if (
                hasDirectText &&
                !srOnly &&
                el.scrollHeight > el.clientHeight + 2 &&
                (style.overflow === 'hidden' || style.overflowY === 'hidden')
              ) {
                issues.overlappingText.push(el.tagName.toLowerCase() + '#clipped');
              }
              
              if (el.tagName.toLowerCase() === 'section' || (el.tagName.toLowerCase() === 'div' && el.parentElement === document.querySelector('main'))) {
                if (style.display === 'flex' || style.display === 'grid') {
                  const children = [...el.children].filter(child => {
                    const cStyle = window.getComputedStyle(child);
                    return cStyle.display !== 'none' && cStyle.position !== 'absolute';
                  });
                  if (children.length === 2) {
                    const w1 = children[0].getBoundingClientRect().width;
                    const w2 = children[1].getBoundingClientRect().width;
                    const total = el.getBoundingClientRect().width;
                    if (total > 0 && Math.abs(w1 - w2) < 20 && Math.abs(w1 - total/2) < 40) {
                      split5050Count++;
                    }
                  }
                }
              }
            }
            if (split5050Count >= 3) {
              issues.repetitiveLayout = true;
            }

            return issues;
          });

          // <video> contract: every site ships exactly one, and it must actually play.
          const videoReport = await page.evaluate(async () => {
            const problems = [];
            const slow = [];
            const vids = [...document.querySelectorAll('video')];
            // Counted by distinct clip, not by element, matching
            // check-site-contract.js: the rule is about shipping one clip. A
            // marquee whose track must hold two identical halves, or a loop in
            // a shared footer, legitimately repeats the same element.
            const distinctClips = new Set();
            for (const v of vids) {
              const refs = [
                ...[...v.querySelectorAll('source')].map((s) => s.getAttribute('src')),
                v.getAttribute('src'),
              ].filter(Boolean);
              for (const ref of refs) {
                // webm and mp4 of the same clip are one clip. The build appends a
                // per-file content hash, which differs between the two encodes, so
                // that has to come off as well or every clip reads as two.
                distinctClips.add(
                  ref
                    .replace(/\?.*$/, '')
                    .replace(/-[A-Za-z0-9_-]{8}\.(webm|mp4)$/i, '')
                    .replace(/\.(webm|mp4)$/i, '')
                );
              }
            }
            if (distinctClips.size > 1) {
              problems.push(
                `${distinctClips.size} distinct video clips (${[...distinctClips].join(', ')}) — every site ships exactly one`
              );
            }
            // Warm every element first, then judge them. Waiting on each in turn
            // gave the second clip in a marquee track its own cold start, which
            // read as an undecodable video when it was merely still loading.
            for (const v of vids) {
              if (v.readyState < 1 && (v.networkState === 3 || v.networkState === 0)) v.load();
            }

            for (const v of vids) {
              const id = v.id ? `video#${v.id}` : v.className ? `video.${String(v.className).split(' ')[0]}` : 'video';
              for (const attr of ['muted', 'loop', 'playsInline']) {
                if (!v[attr]) problems.push(`${id}: missing ${attr === 'playsInline' ? 'playsinline' : attr}`);
              }
              if (!v.getAttribute('poster')) problems.push(`${id}: missing poster`);
              if (!v.getAttribute('preload')) problems.push(`${id}: missing preload`);
              // A video may declare its source either as <source> children or a direct src.
              const sources = [
                ...[...v.querySelectorAll('source')].map((s) => s.getAttribute('src')),
                v.getAttribute('src'),
              ].filter(Boolean);
              if (!sources.length) problems.push(`${id}: no source`);
              else if (!sources.some((src) => /\.webm(\?|$)/i.test(src))) problems.push(`${id}: no .webm source`);
              // Judge the video in the state a visitor meets it: on screen.
              // Sites correctly pause background loops while off-screen, and
              // preload="metadata" means an off-screen element may never get
              // past readyState 0 -- failing that would punish good code.
              const restoreY = window.scrollY;
              v.scrollIntoView({ block: 'center', behavior: 'instant' });
              await new Promise((r) => setTimeout(r, 150));
              // Poll rather than wait once: on a long page the decoder can still
              // be working when the sweep reaches it, and a single short wait
              // reports a perfectly good clip as undecodable. load() is only
              // called for an element that is genuinely stalled — calling it
              // while networkState is LOADING aborts the request in flight and
              // drops the element to NETWORK_NO_SOURCE.
              const DECODE_DEADLINE = Date.now() + 15000;
              while (v.videoWidth === 0 && Date.now() < DECODE_DEADLINE) {
                if (v.networkState === 3 /* NO_SOURCE */ || v.networkState === 0 /* EMPTY */) {
                  v.load();
                }
                await new Promise((r) => {
                  const t = setTimeout(r, 500);
                  v.addEventListener('loadedmetadata', () => { clearTimeout(t); r(); }, { once: true });
                });
              }
              // videoWidth > 0 proves real video metadata was parsed, which a
              // 404 or corrupt source can never do. A source that is still
              // LOADING at the deadline is slow, not broken: a missing or
              // corrupt file lands in NETWORK_NO_SOURCE, and a bad response is
              // already caught by the network-error listener. Failing on
              // LOADING punishes a heavy page rather than a real defect.
              if (v.videoWidth === 0) {
                if (v.networkState === 2 /* NETWORK_LOADING */) {
                  slow.push(`${id}: still decoding at the deadline (readyState ${v.readyState})`);
                } else {
                  problems.push(`${id}: no decodable video (readyState ${v.readyState}, networkState ${v.networkState})`);
                }
              }
              window.scrollTo(0, restoreY);
            }
            return { problems, slow };
          });

          for (const note of videoReport.slow) {
            console.log(`  note: ${pagePath} @${label} ${note}`);
          }

          if (!opts.noScreenshots) {
            const shotPath = `${outDir}/${pagePath.replace(/\//g, '_')}_${label}.png`;
            // Chrome refuses to encode a capture taller than 16384px, and some
            // of these pages run past 19000px on mobile. Clip to the cap rather
            // than let the whole sweep fail on a ProtocolError.
            const CAPTURE_LIMIT = 16384;
            const metrics = await page.evaluate(() => ({
              height: document.documentElement.scrollHeight,
              width: document.documentElement.scrollWidth,
            }));
            if (metrics.height > CAPTURE_LIMIT) {
              await page.screenshot({
                path: shotPath,
                captureBeyondViewport: true,
                clip: { x: 0, y: 0, width: metrics.width, height: CAPTURE_LIMIT },
              });
              console.log(
                `  note: ${pagePath} @${label} is ${metrics.height}px tall; ` +
                  `screenshot clipped to ${CAPTURE_LIMIT}px (qa:visual tiles the full page)`
              );
            } else {
              await page.screenshot({ path: shotPath, fullPage: true });
            }
          }

          return {
            overflowingElements,
            brokenImages,
            missingAltTags: staticResults.missingAltTags,
            missingFavicon: staticResults.missingFavicon,
            nonWebpPhotos: staticResults.nonWebpPhotos,
            consoleErrors: [...consoleErrors],
            pageErrors: [...pageErrors],
            networkErrors: [...networkErrors],
            brokenLinks,
            visualIssues,
            videoIssues: videoReport.problems,
            videoSlow: videoReport.slow,
            device: {
              key: device.key,
              width: device.viewport.width,
              height: device.viewport.height,
              deviceScaleFactor: device.viewport.deviceScaleFactor,
              hasTouch: device.viewport.hasTouch,
              isMobile: device.viewport.isMobile,
            },
          };
        };

        const runViewports = async () => {
          let links = null;
          let first = true;
          for (const device of devices) {
            // Links are page-level, not device-level: check them once on the
            // first device and carry the result so every view reports the same
            // thing without paying for the HEAD requests ten times.
            const view = await checkViewport(device, { checkLinks: links === null });
            if (links === null) links = view.brokenLinks;
            else view.brokenLinks = links;

            // The static checks parse the served HTML, so they are page-level
            // too. Recording them on every view made summary.counts multiply a
            // single missing alt by the device count -- one defect reported as
            // ten. Keep them on the first view only; pageFailed still trips.
            if (!first) {
              view.missingAltTags = [];
              view.missingFavicon = [];
              view.nonWebpPhotos = [];
              view.brokenLinks = [];
            }
            first = false;
            pageResult.views[device.key] = view;
          }
        };

        try {
          await runViewports();
        } catch (err) {
          if (String(err?.message || err).includes('protocolTimeout') || err?.name === 'ProtocolError') {
            console.warn(`Protocol timeout on ${pagePath}; retrying once...`);
            await new Promise((r) => setTimeout(r, 1500));
            await page.reload({ waitUntil: 'domcontentloaded' });
            await runViewports();
          } else {
            throw err;
          }
        }
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

    // Bind the verdict to the bytes it was produced from, so check:ship can
    // refuse a report that describes a build which no longer exists.
    const sourceDigests = {};
    for (const site of targetSlug ? [resolveSlugPath(ROOT, targetSlug)] : findAllSiteDirs(ROOT)) {
      if (site) sourceDigests[site.relativePath] = siteSourceDigest(site.absolutePath);
    }

    const report = {
      generatedAt: new Date().toISOString(),
      slugFilter: targetSlug || null,
      devices: devices.map((d) => ({ key: d.key, ...d.viewport })),
      distDigest: distDigest(ROOT),
      sourceDigests,
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
      for (const f of failed) {
        const where = f.error ? 'load error' : failingDevices(f).join(', ');
        console.error(`  FAIL ${f.path} — ${where}`);
      }
      exitCode = 1;
    }
  } catch (globalError) {
    console.error('Fatal QA Error:', globalError);
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopPreviewServer(server);
    process.exit(exitCode);
  }
})();
