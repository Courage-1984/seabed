import puppeteer from 'puppeteer-core';
import { startPreviewServer, stopPreviewServer, PREVIEW_URL } from '../scripts/lib/preview-server.js';

const server = await startPreviewServer();
const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const page = await browser.newPage();
await page.setViewport({ width: Number(process.argv[3]) || 390, height: 844 });
await page.goto(PREVIEW_URL + process.argv[2], { waitUntil: 'networkidle2', timeout: 90000 });
console.log(JSON.stringify(await page.evaluate(async () => {
  const vids = [...document.querySelectorAll('video')];
  vids.forEach((v) => v.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await new Promise((r) => setTimeout(r, 9000));
  const vw = document.documentElement.clientWidth;
  return vids.map((v) => {
    const r = v.getBoundingClientRect();
    const cs = getComputedStyle(v);
    const p = v.parentElement;
    const pr = p.getBoundingClientRect();
    return {
      cls: v.className,
      ready: v.readyState,
      net: v.networkState,
      vw: v.videoWidth,
      box: `${Math.round(r.left)}..${Math.round(r.right)} of ${vw}`,
      cssWidth: cs.inlineSize || cs.width,
      maxW: cs.maxInlineSize || cs.maxWidth,
      parent: `${p.className} ${Math.round(pr.left)}..${Math.round(pr.right)}`,
    };
  });
}), null, 1));
await browser.close();
await stopPreviewServer(server);
