import puppeteer from 'puppeteer';
import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

function findHtmlFiles(dir, fileList = []) {
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

const pages = ['index.html', ...findHtmlFiles('sites')];
const baseUrl = 'http://localhost:4173/';
const results = [];

const outDir = './qa-screenshots';
if (!existsSync(outDir)) mkdirSync(outDir);

const waitForServer = async (url, timeout = 10000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {
      // ignore
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Server did not start at ${url}`);
};

(async () => {
  console.log('Starting preview server...');
  const server = spawn('npm', ['run', 'preview'], { shell: true });

  try {
    await waitForServer(baseUrl);
    console.log('Server is ready.');
  } catch (err) {
    console.error(err.message);
    server.kill();
    process.exit(1);
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch();

  for (const pagePath of pages) {
    console.log(`Checking ${pagePath}...`);
    const url = pagePath === 'index.html' ? baseUrl : `${baseUrl}${pagePath}`;
    const pageResult = { path: pagePath, mobile: {}, desktop: {} };
    
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      const checkViewport = async (width, height, label) => {
        await page.setViewport({ width, height });
        
        // Force-load lazy images and wait for decode (bounded)
        await page.evaluate(async () => {
          const withTimeout = (p, ms) => Promise.race([
            p,
            new Promise((resolve) => setTimeout(resolve, ms)),
          ]);
          const imgs = [...document.images];
          for (const img of imgs) {
            if (img.loading === 'lazy') img.loading = 'eager';
            if (!img.complete) {
              await withTimeout(new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
              }), 8000);
            }
            try { await withTimeout(img.decode(), 4000); } catch {}
          }
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise(r => setTimeout(r, 300));
          window.scrollTo(0, 0);
        });

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        const brokenImages = await page.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src));
        const nonWebpPhotos = await page.evaluate(() =>
          [...document.querySelectorAll('img[src]')]
            .map((img) => img.getAttribute('src') || '')
            .filter((src) => src && !/\.webp(\?|$)/i.test(src))
            .filter((src) => !/\.svg(\?|$)/i.test(src))
            .filter((src) => !/favicon/i.test(src))
        );
        const brokenLinks = [];
        
        if (pagePath === 'index.html') {
          const links = await page.evaluate(() => [...document.querySelectorAll('a')].map(a => a.href));
          for (const link of links) {
            if (link.startsWith(baseUrl)) {
               try {
                 const res = await fetch(link);
                 if (!res.ok) brokenLinks.push(link);
               } catch(e) { brokenLinks.push(link); }
            }
          }
        }
        
        await page.screenshot({ path: `${outDir}/${pagePath.replace(/\//g, '_')}_${label}.png`, fullPage: true });
        
        return { overflow, brokenImages, nonWebpPhotos, consoleErrors: [...consoleErrors], brokenLinks };
      };

      pageResult.mobile = await checkViewport(390, 844, 'mobile');
      consoleErrors.length = 0;
      pageResult.desktop = await checkViewport(1440, 900, 'desktop');
      
    } catch (err) {
      console.error(`Error processing ${pagePath}:`, err);
      pageResult.error = err.message;
    }

    results.push(pageResult);
    await page.close();
  }

  await browser.close();
  writeFileSync('qa-report.json', JSON.stringify(results, null, 2));
  console.log('QA sweep complete! Saved to qa-report.json');

  const failures = results.filter((r) => {
    const m = r.mobile || {};
    const d = r.desktop || {};
    return (
      r.error ||
      m.overflow ||
      d.overflow ||
      (m.brokenImages && m.brokenImages.length) ||
      (d.brokenImages && d.brokenImages.length) ||
      (m.nonWebpPhotos && m.nonWebpPhotos.length) ||
      (d.nonWebpPhotos && d.nonWebpPhotos.length) ||
      (m.consoleErrors && m.consoleErrors.length) ||
      (d.consoleErrors && d.consoleErrors.length)
    );
  });
  if (failures.length) {
    console.error(`QA FAIL: ${failures.length} page(s) with issues`);
    server.kill();
    process.exit(1);
  }
  
  server.kill();
  process.exit(0);
})();
