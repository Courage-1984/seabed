import puppeteer from 'puppeteer-core';
import { startPreviewServer, stopPreviewServer, PREVIEW_URL } from '../scripts/lib/preview-server.js';
const server = await startPreviewServer();
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(PREVIEW_URL + process.argv[2], { waitUntil: 'networkidle2', timeout: 90000 });
const needle = process.argv[3];
console.log(JSON.stringify(await page.evaluate((needle) => {
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!el.textContent.trim().startsWith(needle)) continue;
    if (el.children.length && !/^(P|H1|H2|H3|H4|A|BUTTON|SPAN|DIV)$/.test(el.tagName)) continue;
    const cs = getComputedStyle(el);
    out.push({ tag: el.tagName, cls: el.className, id: el.id, color: cs.color, bg: cs.backgroundColor, outer: el.outerHTML.slice(0, 150) });
    if (out.length > 3) break;
  }
  return out;
}, needle), null, 1));
await browser.close();
await stopPreviewServer(server);
