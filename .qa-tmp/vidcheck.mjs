import puppeteer from 'puppeteer-core';
import { startPreviewServer, stopPreviewServer, PREVIEW_URL } from '../scripts/lib/preview-server.js';

const server = await startPreviewServer();
const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(PREVIEW_URL + process.argv[2], { waitUntil: 'networkidle2', timeout: 90000 });
console.log(JSON.stringify(await page.evaluate(async () => {
  const vids = [...document.querySelectorAll('video')];
  for (const v of vids) {
    v.scrollIntoView({ block: 'center', behavior: 'instant' });
  }
  // Give every element a generous, shared window rather than 6s each in turn.
  await new Promise((r) => setTimeout(r, 8000));
  return vids.map((v) => {
    const rect = v.getBoundingClientRect();
    return {
      cls: v.className,
      readyState: v.readyState,
      networkState: v.networkState,
      videoWidth: v.videoWidth,
      currentSrc: (v.currentSrc || '').split('/').pop(),
      rect: `${Math.round(rect.left)},${Math.round(rect.top)} ${Math.round(rect.width)}x${Math.round(rect.height)}`,
    };
  });
}), null, 1));
await browser.close();
await stopPreviewServer(server);
