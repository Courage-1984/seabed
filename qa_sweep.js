import puppeteer from 'puppeteer';
import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

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

(async () => {
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
        
        // Scroll to trigger lazy loading
        await page.evaluate(async () => {
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise(r => setTimeout(r, 1000));
          window.scrollTo(0, 0);
        });
        await new Promise(r => setTimeout(r, 1000));

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        const brokenImages = await page.evaluate(() => [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src));
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
        
        return { overflow, brokenImages, consoleErrors: [...consoleErrors], brokenLinks };
      };

      pageResult.mobile = await checkViewport(360, 800, 'mobile');
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
})();
