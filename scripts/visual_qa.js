#!/usr/bin/env node
/**
 * Deep visual QA sweep — tiled screenshots + a navigation walkthrough recording.
 *
 * This is the evidence-gathering half of the Extreme Visual Audit (AGENTS.md).
 * It does not replace `npm run qa` (the correctness sweep); it produces the
 * artifacts the agent must actually look at before setting qa: "v2-pass".
 *
 * Usage:
 *   node scripts/visual_qa.js <slug> [--no-record] [--no-tiles] [--concurrency N]
 *
 * Outputs:
 *   qa-screenshots/<slug>/<page>/<bp>/tile-NN.png   viewport tiles, top to bottom
 *   qa-screenshots/<slug>/<page>/<bp>/full.png      full-page composite
 *   qa-screenshots/<slug>/INDEX.md                  ordered manifest of every artifact
 *   qa-recordings/<slug>-walkthrough.webm           scripted navigation recording
 *   qa-visual-report.json                           machine-readable findings
 *
 * Recording requires ffmpeg on PATH; without it the run continues and warns.
 */
import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, renameSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveSlugPath } from './lib/resolve-slug.js';
import { PREVIEW_URL, mapPool, startPreviewServer, stopPreviewServer } from './lib/preview-server.js';

const ROOT = resolve('.');
const SHOT_ROOT = join(ROOT, 'qa-screenshots');
const REC_ROOT = join(ROOT, 'qa-recordings');

const BREAKPOINTS = [
  { label: 'mobile-390', width: 390, height: 844, isMobile: true },
  { label: 'tablet-768', width: 768, height: 1024, isMobile: true },
  { label: 'desktop-1440', width: 1440, height: 900, isMobile: false },
  { label: 'wide-1920', width: 1920, height: 1080, isMobile: false },
];

/**
 * Tile budget. Long pages get more tiles rather than gappy ones -- a step
 * larger than the viewport would skip content entirely, which defeats the
 * point of reviewing every tile.
 */
const MAX_TILES = 44;
/** Tiles overlap so nothing can hide at a seam. */
const TILE_OVERLAP = 0.15;
/** Never let the step exceed this fraction of the viewport (i.e. keep 5% overlap). */
const MIN_TILE_OVERLAP = 0.05;

function parseArgs(argv) {
  const flags = { slug: null, record: true, tiles: true, concurrency: 1 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-record') flags.record = false;
    else if (a === '--no-tiles') flags.tiles = false;
    else if (a === '--concurrency') flags.concurrency = Number(argv[++i]);
    else if (a.startsWith('--')) {
      console.error(`Unknown flag: ${a}`);
      process.exit(2);
    } else flags.slug = a;
  }
  return flags;
}

const opts = parseArgs(process.argv.slice(2));
if (!opts.slug) {
  console.error('Usage: node scripts/visual_qa.js <slug> [--no-record] [--no-tiles] [--concurrency N]');
  process.exit(2);
}

const site = resolveSlugPath(ROOT, opts.slug);
if (!site) {
  console.error(`VISUAL_QA_FAIL: site not found for slug "${opts.slug}"`);
  process.exit(1);
}
const slug = site.slug;

function hasFfmpeg() {
  const res = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  return !res.error && res.status === 0;
}

function findHtmlFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) findHtmlFiles(full, out);
    else if (ent.name.endsWith('.html')) out.push(full.replace(/\\/g, '/'));
  }
  return out;
}

const pagePaths = findHtmlFiles(join(ROOT, site.relativePath)).map((p) => relative(ROOT, p).replace(/\\/g, '/'));
if (!pagePaths.length) {
  console.error(`VISUAL_QA_FAIL: no HTML pages under ${site.relativePath}/`);
  process.exit(1);
}
// index.html first, then the rest alphabetically — the order a visitor meets them.
pagePaths.sort((a, b) => {
  const ai = a.endsWith('/index.html') ? 0 : 1;
  const bi = b.endsWith('/index.html') ? 0 : 1;
  return ai - bi || a.localeCompare(b);
});

// --- cleanup previous run ----------------------------------------------------
const slugShotDir = join(SHOT_ROOT, slug);
rmSync(slugShotDir, { recursive: true, force: true });
mkdirSync(slugShotDir, { recursive: true });
mkdirSync(REC_ROOT, { recursive: true });
for (const f of readdirSync(REC_ROOT)) {
  if (f.startsWith(`${slug}-`)) rmSync(join(REC_ROOT, f), { force: true });
}

/**
 * Runs in the page. Returns legibility/UX findings that the correctness sweep
 * does not cover — most importantly text sitting on media with no scrim.
 */
function collectVisualFindings(isMobile) {
  const findings = {
    textOverMediaNoScrim: [],
    lowContrastText: [],
    tightLineHeight: [],
    smallTapTargets: [],
    viewportHeightClipping: [],
    horizontalScroll: false,
    stickyHeaderNoScrollPadding: false,
  };

  const sel = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/)[0]}` : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`.slice(0, 120);
  };

  const hasDirectText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);

  const parseRgb = (str) => {
    const m = String(str).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(',').map((n) => parseFloat(n));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };

  const luminance = ({ r, g, b }) => {
    const f = (c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };

  const contrast = (a, b) => {
    const l1 = luminance(a);
    const l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  // Nearest ancestor with an opaque background colour, or null if media intervenes.
  const backdropOf = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return { media: true, node };
      const bg = parseRgb(cs.backgroundColor);
      if (bg && bg.a >= 0.85) return { media: false, colour: bg, node };
      node = node.parentElement;
    }
    const bodyBg = parseRgb(getComputedStyle(document.body).backgroundColor);
    return { media: false, colour: bodyBg && bodyBg.a >= 0.85 ? bodyBg : { r: 255, g: 255, b: 255, a: 1 } };
  };

  // Media boxes that could sit behind text (video, img, canvas).
  const mediaBoxes = [...document.querySelectorAll('video, img, canvas')]
    .map((m) => ({ el: m, rect: m.getBoundingClientRect(), z: Number(getComputedStyle(m).zIndex) || 0 }))
    .filter((m) => m.rect.width > 120 && m.rect.height > 80);

  const overlapsMedia = (rect) =>
    mediaBoxes.some(
      (m) =>
        m.rect.left < rect.right &&
        m.rect.right > rect.left &&
        m.rect.top < rect.bottom &&
        m.rect.bottom > rect.top &&
        m.rect.width * m.rect.height > rect.width * rect.height
    );

  // A scrim is any ancestor between the text and the media carrying a
  // translucent wash, a gradient, or a backdrop-filter. text-shadow counts too.
  const hasScrim = (el) => {
    let node = el;
    for (let depth = 0; node && depth < 6; depth++, node = node.parentElement) {
      const cs = getComputedStyle(node);
      if (cs.textShadow && cs.textShadow !== 'none') return true;
      if (cs.backdropFilter && cs.backdropFilter !== 'none') return true;
      if (/gradient/i.test(cs.backgroundImage)) return true;
      const bg = parseRgb(cs.backgroundColor);
      if (bg && bg.a >= 0.25) return true;
      // A dedicated overlay sibling (::before is not reachable, so look for one).
      for (const child of node.children) {
        const ccs = getComputedStyle(child);
        if (
          ccs.position === 'absolute' &&
          (/gradient/i.test(ccs.backgroundImage) || (parseRgb(ccs.backgroundColor)?.a ?? 0) >= 0.25)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    if (!hasDirectText(el)) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;

    const fontSize = parseFloat(cs.fontSize);
    const lineHeight = parseFloat(cs.lineHeight);
    const bold = Number(cs.fontWeight) >= 700;
    const large = fontSize >= 24 || (fontSize >= 18.66 && bold);

    if (Number.isFinite(lineHeight) && fontSize >= 12 && lineHeight / fontSize < 1.2 && !large) {
      findings.tightLineHeight.push(`${sel(el)} (${(lineHeight / fontSize).toFixed(2)})`);
    }

    const fg = parseRgb(cs.color);
    if (!fg) continue;
    const backdrop = backdropOf(el);

    if (backdrop.media || overlapsMedia(rect)) {
      if (!hasScrim(el)) {
        findings.textOverMediaNoScrim.push(sel(el));
      }
      continue; // pixel contrast is unknowable against moving media
    }

    if (backdrop.colour) {
      const ratio = contrast(fg, backdrop.colour);
      const min = large ? 3 : 4.5;
      if (ratio < min) {
        findings.lowContrastText.push(`${sel(el)} ${ratio.toFixed(2)}:1 (needs ${min}:1)`);
      }
    }
  }

  if (isMobile) {
    for (const el of document.querySelectorAll('a, button, input, select, textarea, [role="button"], [role="link"]')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.width < 44 || r.height < 44) {
        findings.smallTapTargets.push(`${sel(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
  }

  // Sections locked to the viewport height that cannot contain their content.
  for (const el of document.querySelectorAll('section, header, div, main')) {
    const cs = getComputedStyle(el);
    const h = parseFloat(cs.height);
    if (!Number.isFinite(h)) continue;
    if (
      Math.abs(h - window.innerHeight) < 2 &&
      el.scrollHeight > el.clientHeight + 4 &&
      cs.overflowY !== 'auto' &&
      cs.overflowY !== 'scroll'
    ) {
      findings.viewportHeightClipping.push(`${sel(el)} content ${el.scrollHeight}px in ${Math.round(h)}px`);
    }
  }

  findings.horizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;

  const pinned = [...document.querySelectorAll('header, nav, [class*="header"], [class*="nav"]')].find((el) => {
    const cs = getComputedStyle(el);
    return (cs.position === 'fixed' || cs.position === 'sticky') && parseFloat(cs.top || '0') < 40;
  });
  if (pinned && document.querySelector('a[href^="#"]')) {
    const rootPad = getComputedStyle(document.documentElement).scrollPaddingTop;
    const bodyPad = getComputedStyle(document.body).scrollPaddingTop;
    const has = (v) => v && v !== 'auto' && v !== '0px';
    if (!has(rootPad) && !has(bodyPad)) findings.stickyHeaderNoScrollPadding = true;
  }

  const dedupe = (arr) => [...new Set(arr)].slice(0, 25);
  findings.textOverMediaNoScrim = dedupe(findings.textOverMediaNoScrim);
  findings.lowContrastText = dedupe(findings.lowContrastText);
  findings.tightLineHeight = dedupe(findings.tightLineHeight);
  findings.smallTapTargets = dedupe(findings.smallTapTargets);
  findings.viewportHeightClipping = dedupe(findings.viewportHeightClipping);
  return findings;
}

async function settlePage(page) {
  // Force everything in, then walk the page so scroll-triggered motion fires.
  await page.evaluate(async () => {
    for (const img of document.images) img.loading = 'eager';
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 250));
  });
}

async function captureTiles(page, bp, outDir) {
  const tiles = [];
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const idealStep = Math.max(1, Math.round(bp.height * (1 - TILE_OVERLAP)));
  const idealCount = Math.max(1, Math.ceil((pageHeight - bp.height) / idealStep) + 1);

  // Long pages trade overlap for coverage, but only down to MIN_TILE_OVERLAP.
  // Past that the step would exceed the viewport and skip whole bands of the
  // page, so tiles are added instead -- an unreviewed band is worse than a few
  // extra screenshots.
  const maxStep = Math.max(1, Math.floor(bp.height * (1 - MIN_TILE_OVERLAP)));
  const coverageCount = Math.max(1, Math.ceil(Math.max(0, pageHeight - bp.height) / maxStep) + 1);
  const count = Math.min(MAX_TILES, Math.max(idealCount, idealCount > MAX_TILES ? coverageCount : 1));
  const step = count > 1 ? Math.max(1, Math.ceil(Math.max(0, pageHeight - bp.height) / (count - 1))) : idealStep;

  for (let i = 0; i < count; i++) {
    const y = Math.min(i * step, Math.max(0, pageHeight - bp.height));
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await new Promise((r) => setTimeout(r, 260));
    const name = `tile-${String(i + 1).padStart(2, '0')}.png`;
    await page.screenshot({ path: join(outDir, name) });
    tiles.push({ name, scrollY: y });
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: join(outDir, 'full.png'), fullPage: true });
  const overlapPct = count > 1 ? Math.round((1 - step / bp.height) * 100) : Math.round(TILE_OVERLAP * 100);
  return { tiles, pageHeight, step, overlapPct, thinOverlap: overlapPct < 5 };
}

/** Scripted walkthrough: what a visitor does, at a pace a human can watch. */
async function recordWalkthrough(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const outPath = join(REC_ROOT, `${slug}-walkthrough.webm`);
  await page.goto(url, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));

  const recorder = await page.screencast({ path: outPath });
  try {
    // 1. Eased scroll to the bottom, so motion systems fire at a watchable pace.
    await page.evaluate(async () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const steps = 90;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        window.scrollTo(0, total * eased);
        await new Promise((r) => setTimeout(r, 90));
      }
      await new Promise((r) => setTimeout(r, 700));
    });

    // 2. Back to the top.
    await page.evaluate(async () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await new Promise((r) => setTimeout(r, 1400));
    });

    // 3. Hover the nav, then the primary CTA.
    const hoverTargets = await page.evaluate(() => {
      const out = [];
      const push = (el) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width > 4 && r.height > 4 && r.top >= 0 && r.top < window.innerHeight) {
          out.push({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) });
        }
      };
      document.querySelectorAll('nav a, header a').forEach(push);
      push(document.querySelector('[class*="cta"], .btn, button'));
      return out.slice(0, 8);
    });
    for (const t of hoverTargets) {
      await page.mouse.move(t.x, t.y, { steps: 12 });
      await new Promise((r) => setTimeout(r, 420));
    }

    // 4. Dwell on the video and on anything with a hover treatment.
    const featureTargets = await page.evaluate(async () => {
      const out = [];
      for (const el of document.querySelectorAll('video, [class*="card"], [class*="tile"], [class*="reveal"]')) {
        const r = el.getBoundingClientRect();
        if (r.width < 60 || r.height < 40) continue;
        out.push({ top: window.scrollY + r.top - 200, x: Math.round(r.left + r.width / 2) });
        if (out.length >= 5) break;
      }
      return out;
    });
    for (const t of featureTargets) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'smooth' }), Math.max(0, t.top));
      await new Promise((r) => setTimeout(r, 900));
      await page.mouse.move(t.x, 450, { steps: 10 });
      await new Promise((r) => setTimeout(r, 900));
    }

    // 5. Walk every internal page and scroll it.
    const links = await page.evaluate(() =>
      [...document.querySelectorAll('a[href]')]
        .map((a) => a.getAttribute('href'))
        .filter((h) => h && !h.startsWith('#') && !/^https?:|^mailto:|^tel:/i.test(h))
        .slice(0, 4)
    );
    for (const href of [...new Set(links)]) {
      try {
        await page.goto(new URL(href, url).href, { waitUntil: 'networkidle2', timeout: 20000 });
        await new Promise((r) => setTimeout(r, 600));
        await page.evaluate(async () => {
          const total = document.documentElement.scrollHeight - window.innerHeight;
          for (let i = 0; i <= 30; i++) {
            window.scrollTo(0, (total * i) / 30);
            await new Promise((r) => setTimeout(r, 80));
          }
        });
      } catch {
        /* a broken link is the correctness sweep's job to report */
      }
    }
  } finally {
    await recorder.stop();
    await page.close().catch(() => {});
  }

  // Puppeteer's screencast is near-lossless (tens of MB). Re-encode so the
  // artifact is small enough to hand around and quick to scrub through.
  const compressed = join(REC_ROOT, `${slug}-walkthrough.tmp.webm`);
  const enc = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-i',
      outPath,
      '-an',
      '-vf',
      "scale='min(1280,iw)':-2",
      '-c:v',
      'libvpx-vp9',
      '-crf',
      '36',
      '-b:v',
      '0',
      '-row-mt',
      '1',
      '-deadline',
      'good',
      compressed,
    ],
    { encoding: 'utf8' }
  );
  if (!enc.error && enc.status === 0 && existsSync(compressed)) {
    rmSync(outPath, { force: true });
    renameSync(compressed, outPath);
  } else {
    rmSync(compressed, { force: true });
    console.warn('VISUAL_QA_WARN: could not compress the recording — keeping the raw screencast.');
  }
  return outPath;
}

// --- main --------------------------------------------------------------------
let server = null;
let browser = null;
let exitCode = 0;

(async () => {
  try {
    if (!existsSync(join(ROOT, 'dist'))) {
      console.error('VISUAL_QA_FAIL: dist/ not found — run `npm run build` first.');
      process.exit(1);
    }

    const canRecord = opts.record && hasFfmpeg();
    if (opts.record && !canRecord) {
      console.warn(
        'VISUAL_QA_WARN: ffmpeg not found on PATH — skipping the walkthrough recording.\n' +
          '  Install FFmpeg (https://ffmpeg.org/download.html) to get qa-recordings/<slug>-walkthrough.webm.'
      );
    }

    console.log('Starting preview server...');
    server = await startPreviewServer({ stdio: 'ignore' });
    console.log(`Server ready at ${PREVIEW_URL}`);

    browser = await puppeteer.launch({
      headless: true,
      protocolTimeout: 300_000,
      args: process.env.CI === 'true' ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
    });

    const report = { generatedAt: new Date().toISOString(), slug, pages: [], recording: null };
    const manifest = [];

    const capturePage = async (pagePath) => {
      const url = new URL(pagePath, PREVIEW_URL).href;
      const pageKey = pagePath
        .replace(/^sites\//, '')
        .replace(/\//g, '__')
        .replace(/\.html$/, '');
      const entry = { path: pagePath, url, breakpoints: {} };
      console.log(`\n${pagePath}`);

      const page = await browser.newPage();
      try {
        for (const bp of BREAKPOINTS) {
          await page.setViewport({ width: bp.width, height: bp.height, isMobile: bp.isMobile });
          await page.goto(url, { waitUntil: 'networkidle2' });
          await settlePage(page);

          const findings = await page.evaluate(collectVisualFindings, bp.isMobile);
          const bpDir = join(slugShotDir, pageKey, bp.label);
          let shots = { tiles: [], pageHeight: 0, overlapPct: 0, thinOverlap: false };
          if (opts.tiles) {
            mkdirSync(bpDir, { recursive: true });
            shots = await captureTiles(page, bp, bpDir);
            for (const t of shots.tiles) {
              manifest.push(`qa-screenshots/${slug}/${pageKey}/${bp.label}/${t.name}`);
            }
            manifest.push(`qa-screenshots/${slug}/${pageKey}/${bp.label}/full.png`);
          }

          const issueCount =
            findings.textOverMediaNoScrim.length +
            findings.lowContrastText.length +
            findings.tightLineHeight.length +
            findings.smallTapTargets.length +
            findings.viewportHeightClipping.length +
            (findings.horizontalScroll ? 1 : 0) +
            (findings.stickyHeaderNoScrollPadding ? 1 : 0);

          entry.breakpoints[bp.label] = {
            findings,
            tiles: shots.tiles.length,
            pageHeight: shots.pageHeight,
            overlapPct: shots.overlapPct,
          };
          console.log(
            `  ${bp.label.padEnd(13)} ${String(shots.tiles.length).padStart(2)} tiles  ${issueCount} finding(s)`
          );
          if (shots.thinOverlap) {
            console.warn(
              `  ${bp.label}: ${shots.pageHeight}px spread over ${MAX_TILES} tiles — only ${shots.overlapPct}% overlap`
            );
          }
        }
      } finally {
        await page.close().catch(() => {});
      }
      return entry;
    };

    report.pages = await mapPool(pagePaths, Math.max(1, opts.concurrency), capturePage);

    if (canRecord) {
      console.log('\nRecording navigation walkthrough...');
      const indexPage = pagePaths.find((p) => p.endsWith('/index.html')) ?? pagePaths[0];
      const recPath = await recordWalkthrough(browser, new URL(indexPage, PREVIEW_URL).href);
      report.recording = relative(ROOT, recPath).replace(/\\/g, '/');
      manifest.push(report.recording);
      console.log(`  -> ${report.recording}`);
    }

    // --- INDEX.md: the artifact list the agent is held to reviewing ---
    const totals = { tiles: 0, findings: {} };
    for (const p of report.pages) {
      for (const [bp, data] of Object.entries(p.breakpoints)) {
        totals.tiles += data.tiles;
        for (const [k, v] of Object.entries(data.findings)) {
          const n = Array.isArray(v) ? v.length : v ? 1 : 0;
          if (n) totals.findings[k] = (totals.findings[k] ?? 0) + n;
        }
        void bp;
      }
    }

    const lines = [
      `# Visual QA artifacts — ${slug}`,
      '',
      `Generated ${report.generatedAt}`,
      '',
      `**Review every file listed below.** ${totals.tiles} tiles across ${report.pages.length} page(s) and ${BREAKPOINTS.length} breakpoints` +
        `${report.recording ? ', plus one walkthrough recording' : ''}.`,
      '',
      '## Automated findings',
      '',
    ];
    if (Object.keys(totals.findings).length) {
      for (const [k, v] of Object.entries(totals.findings)) lines.push(`- \`${k}\`: ${v}`);
      lines.push('', 'Details per page/breakpoint in `qa-visual-report.json`.');
    } else {
      lines.push('- none — the heuristics found nothing. This does **not** substitute for reviewing the artifacts.');
    }
    lines.push('', '## Artifacts, in review order', '');
    for (const p of report.pages) {
      lines.push(`### ${p.path}`, '');
      const pageKey = p.path
        .replace(/^sites\//, '')
        .replace(/\//g, '__')
        .replace(/\.html$/, '');
      for (const bp of BREAKPOINTS) {
        const data = p.breakpoints[bp.label];
        if (!data) continue;
        lines.push(
          `- **${bp.label}** (${bp.width}x${bp.height}) — ${data.tiles} tiles, page height ${data.pageHeight}px`
        );
        for (let i = 1; i <= data.tiles; i++) {
          lines.push(`  - \`qa-screenshots/${slug}/${pageKey}/${bp.label}/tile-${String(i).padStart(2, '0')}.png\``);
        }
        lines.push(`  - \`qa-screenshots/${slug}/${pageKey}/${bp.label}/full.png\``);
      }
      lines.push('');
    }
    if (report.recording) {
      lines.push(
        '### Walkthrough recording',
        '',
        `- \`${report.recording}\``,
        '',
        'Watch it for: layout shift during scroll, animations firing late/never/repeatedly, sticky elements colliding,',
        'text illegible over media, dead hover states, broken navigation, and video that fails to play or shows a black frame.',
        ''
      );
    }

    writeFileSync(join(slugShotDir, 'INDEX.md'), `${lines.join('\n')}\n`, 'utf8');
    writeFileSync(join(ROOT, 'qa-visual-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    console.log(
      `\nVISUAL_QA_OK: ${totals.tiles} tiles, ${Object.values(totals.findings).reduce((a, b) => a + b, 0)} heuristic finding(s)`
    );
    console.log(`  manifest: qa-screenshots/${slug}/INDEX.md`);
    console.log('  report:   qa-visual-report.json');
    console.log('\nThe artifacts are evidence, not a verdict — review them before setting qa: "v2-pass".');
  } catch (err) {
    console.error('VISUAL_QA_FAIL:', err);
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopPreviewServer(server);
    process.exit(exitCode);
  }
})();
