// Replicates scripts/visual_qa.js's contrast heuristic so a fix can be aimed at
// the real element instead of a guess.
import puppeteer from 'puppeteer-core';
import { startPreviewServer, stopPreviewServer, PREVIEW_URL } from '../scripts/lib/preview-server.js';

const server = await startPreviewServer();
const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(PREVIEW_URL + process.argv[2], { waitUntil: 'networkidle2' });
console.log(JSON.stringify(await page.evaluate(() => {
  const parseRgb = (str) => {
    const m = String(str).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (a, b) => {
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const backdropOf = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return { media: true };
      const bg = parseRgb(cs.backgroundColor);
      if (bg && bg.a >= 0.85) return { colour: bg, node };
      node = node.parentElement;
    }
    return { colour: { r: 255, g: 255, b: 255, a: 1 } };
  };
  const hasDirectText = (el) =>
    [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);

  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    if (!hasDirectText(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const fs = parseFloat(cs.fontSize);
    const large = fs >= 24 || (fs >= 18.66 && Number(cs.fontWeight) >= 700);
    const fg = parseRgb(cs.color);
    const bd = backdropOf(el);
    if (bd.media || !bd.colour || !fg) continue;
    const ratio = contrast(fg, bd.colour);
    if (ratio < (large ? 3 : 4.5)) {
      const cls = typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/).join('.')
        : '';
      out.push({
        sel: el.tagName.toLowerCase() + cls,
        text: el.textContent.trim().slice(0, 32),
        ratio: Number(ratio.toFixed(2)),
        color: cs.color,
        on: (bd.node ? bd.node.tagName.toLowerCase() + (typeof bd.node.className === 'string' && bd.node.className.trim() ? '.' + bd.node.className.trim().split(/\s+/)[0] : '') : 'body'),
        bg: `rgb(${bd.colour.r}, ${bd.colour.g}, ${bd.colour.b})`,
      });
    }
  }
  const seen = new Set();
  return out.filter((f) => {
    const k = f.sel + f.ratio;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}), null, 1));
await browser.close();
await stopPreviewServer(server);
