#!/usr/bin/env node
/**
 * Deep visual QA sweep — tiled screenshots + a navigation walkthrough recording.
 *
 * This is the evidence-gathering half of the Extreme Visual Audit (AGENTS.md).
 * It does not replace `npm run qa` (the correctness sweep); it produces the
 * artifacts the agent must actually look at before setting qa: "v2-pass".
 *
 * Usage:
 *   node scripts/visual_qa.js <slug> [--no-record] [--no-tiles] [--no-sheets]
 *                             [--concurrency N] [--devices core|fast|<keys>] [--full-dpr]
 *
 * Outputs:
 *   qa-screenshots/<slug>/<page>/<device>/tile-NN.png  viewport tiles, top to bottom
 *   qa-screenshots/<slug>/<page>/<device>/full.png     full-page composite
 *   qa-screenshots/<slug>/sheets/*.png                 contact sheets — what the agent reads
 *   qa-screenshots/<slug>/INDEX.md                     ordered list of what to review
 *   qa-screenshots/<slug>/MANIFEST.json                digests check:vision binds a review to
 *   qa-recordings/<slug>-walkthrough.webm              scripted navigation recording
 *   qa-visual-report.json                              machine-readable findings
 *
 * Recording requires ffmpeg on PATH; without it the run continues and warns.
 * A run that gathers no evidence exits non-zero rather than reporting clean.
 */
import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, renameSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolveSlugPath } from './lib/resolve-slug.js';
import { resolveDevices, applyDevice, describeDevice } from './lib/device-matrix.js';
import { siteSourceDigest } from './lib/source-digest.js';
import { visualBlockers } from './lib/qa-verdict.js';
import { buildContactSheets } from './build-contact-sheets.js';
import { PREVIEW_URL, mapPool, startPreviewServer, stopPreviewServer } from './lib/preview-server.js';

const ROOT = resolve('.');
const SHOT_ROOT = join(ROOT, 'qa-screenshots');
const REC_ROOT = join(ROOT, 'qa-recordings');


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
  const flags = {
    slug: null,
    record: true,
    tiles: true,
    sheets: true,
    concurrency: 1,
    devices: 'core',
    fullDpr: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-record') flags.record = false;
    else if (a === '--no-tiles') flags.tiles = false;
    else if (a === '--no-sheets') flags.sheets = false;
    else if (a === '--concurrency') flags.concurrency = Number(argv[++i]);
    else if (a === '--devices') flags.devices = argv[++i];
    else if (a === '--full-dpr') flags.fullDpr = true;
    else if (a.startsWith('--')) {
      console.error(`Unknown flag: ${a}`);
      process.exit(2);
    } else flags.slug = a;
  }
  return flags;
}

const opts = parseArgs(process.argv.slice(2));
if (!opts.slug) {
  console.error(
    'Usage: node scripts/visual_qa.js <slug> [--no-record] [--no-tiles] [--no-sheets] [--concurrency N] [--devices core|fast|<keys>] [--full-dpr]'
  );
  process.exit(2);
}

let DEVICES;
try {
  DEVICES = resolveDevices(opts.devices, { fullDpr: opts.fullDpr });
} catch (err) {
  console.error(err.message);
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

const slugShotDir = join(SHOT_ROOT, slug);

/**
 * Clears the previous run's artifacts.
 *
 * Deliberately NOT run at module load. It used to be, which meant that running
 * qa:visual without a build deleted every sheet and the MANIFEST, exited on the
 * missing dist/, and left check:vision reporting "no visual-QA evidence" and
 * check:ship blocked -- destroying evidence to report a precondition failure.
 */
function cleanupPreviousRun() {
  rmSync(slugShotDir, { recursive: true, force: true });
  mkdirSync(slugShotDir, { recursive: true });
  mkdirSync(REC_ROOT, { recursive: true });
  for (const f of readdirSync(REC_ROOT)) {
    if (f.startsWith(`${slug}-`)) rmSync(join(REC_ROOT, f), { force: true });
  }
}

/**
 * Runs in the page. Returns legibility/UX findings that the correctness sweep
 * does not cover — most importantly text sitting on media with no scrim.
 */
function collectVisualFindings(ctx) {
  const isMobile = ctx.isMobile;
  const hasTouch = ctx.hasTouch;

  const findings = {
    textOverMediaNoScrim: [],
    lowContrastText: [],
    tightLineHeight: [],
    smallTapTargets: [],
    viewportHeightClipping: [],
    horizontalScroll: false,
    stickyHeaderNoScrollPadding: false,
    // Added after imperivm-spqr shipped broken on mobile through every gate.
    // Each of these has a known-failing fixture in that site.
    intrinsicOverflow: [],
    horizontalScrollCulprits: [],
    clippedByOverflowHidden: [],
    uncollapsibleTrack: [],
    unbreakableText: [],
    iosZoomInputs: [],
    unlabelledField: [],
    clippedPlaceholder: [],
    viewportMeta: null,
    viewportUnitRisk: [],
    directionalScrim: [],
    tapTargetSpacing: [],
    hoverOnlyAffordance: [],
    modalScrollLock: [],
    safeAreaInset: [],
    truncated: {},
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

  // Source-over compositing, the operation the browser actually performs.
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  // The effective backdrop behind an element, or media if a picture intervenes.
  //
  // This used to take the first ancestor with alpha >= 0.85 and score against
  // it, which silently ignored every stack of translucent washes -- the common
  // case in these sites, where a card is rgba(...,0.6) over a tinted section
  // over the body. Collect the layers and composite them instead.
  const backdropOf = (el) => {
    const layers = [];
    let node = el;
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && /url\(/i.test(cs.backgroundImage)) {
        return { media: true, node };
      }
      const bg = parseRgb(cs.backgroundColor);
      if (bg && bg.a > 0) {
        layers.push(bg);
        if (bg.a >= 0.999) break;
      }
      node = node.parentElement;
    }
    const bodyBg = parseRgb(getComputedStyle(document.body).backgroundColor);
    let base =
      layers.length && layers[layers.length - 1].a >= 0.999
        ? layers.pop()
        : bodyBg && bodyBg.a >= 0.999
          ? bodyBg
          : { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return { media: false, colour: base, node };
  };

  // Media boxes that could sit behind text. Not just media elements: a hero
  // whose photograph is a background-image on a sibling layer is the common
  // shape, and the ancestor walk cannot see it either, so text over it was
  // being scored against the section's own background colour.
  const isBackgroundMedia = (el) => {
    const bg = getComputedStyle(el).backgroundImage;
    return bg && bg !== 'none' && /url\(/i.test(bg);
  };
  const mediaCandidates = [
    ...document.querySelectorAll('video, img, canvas'),
    ...[...document.querySelectorAll('div, section, span, a, header, figure')].filter(isBackgroundMedia),
  ];
  const mediaBoxes = mediaCandidates
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
      // A dedicated overlay sibling, including one drawn as that sibling's
      // ::before/::after — the usual way a background-image hero is scrimmed.
      for (const child of node.children) {
        const ccs = getComputedStyle(child);
        for (const pseudo of ['::before', '::after']) {
          const pcs = getComputedStyle(child, pseudo);
          if (pcs.content === 'none') continue;
          if (/gradient/i.test(pcs.backgroundImage) || (parseRgb(pcs.backgroundColor)?.a ?? 0) >= 0.25) {
            return true;
          }
        }
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
      // Translucent text was previously scored at full strength, which reads
      // as far more contrast than the eye gets.
      const fgEffective = fg.a < 1 ? over(fg, backdrop.colour) : fg;
      const ratio = contrast(fgEffective, backdrop.colour);
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
  //
  // A decorative parallax layer is not this: a scaled background image overflows
  // its box by design, and a transformed descendant still counts toward
  // scrollHeight even under `overflow: clip`. So a box that holds no text and
  // clips what it holds is exempt -- nothing readable is being cut off, and
  // nothing is visibly spilling either. A viewport-locked box with real content
  // to lose always has text in it, so the check keeps its teeth.
  for (const el of document.querySelectorAll('section, header, div, main')) {
    const cs = getComputedStyle(el);
    const h = parseFloat(cs.height);
    if (!Number.isFinite(h)) continue;
    const clips =
      cs.overflowY === 'hidden' || cs.overflowY === 'clip' || cs.contain.includes('paint');
    const hasText = (el.textContent || '').trim().length > 0;
    if (
      Math.abs(h - window.innerHeight) < 2 &&
      el.scrollHeight > el.clientHeight + 4 &&
      cs.overflowY !== 'auto' &&
      cs.overflowY !== 'scroll' &&
      !(clips && !hasText)
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

  // ---------------------------------------------------------------------
  // Mobile-layout checks.
  //
  // Everything below was added because imperivm-spqr passed every gate while
  // being unusable on a phone: two 1024px images with no max-width rule, a
  // grid track that floors at 300px, an unbreakable 19-character token, and
  // form inputs under 16px. Each check names the element so the fix is
  // mechanical rather than a hunt.
  // ---------------------------------------------------------------------

  // Every author style rule, read once. Same-origin under preview, but a
  // cross-origin sheet throws on .cssRules, so guard per sheet.
  const styleRules = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    const walk = (list) => {
      for (const rule of list) {
        if (rule.styleSheet) continue;
        if (rule.cssRules) walk(rule.cssRules);
        if (rule.selectorText && rule.style) styleRules.push(rule);
      }
    };
    walk(rules || []);
  }
  const allCss = styleRules.map((r) => r.cssText).join('\n');

  const containingWidth = (el) => {
    const parent = el.parentElement;
    if (!parent) return document.documentElement.clientWidth;
    const pcs = getComputedStyle(parent);
    return parent.clientWidth - parseFloat(pcs.paddingLeft || '0') - parseFloat(pcs.paddingRight || '0');
  };

  // 1. Replaced elements wider than the box holding them -- the missing
  //    `img { max-width: 100% }` reset, the most common way one of these
  //    sites breaks on a phone.
  for (const el of document.querySelectorAll('img, video, iframe, canvas, svg, embed, object')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (cs.position === 'fixed' || cs.position === 'absolute') continue;
    const w = el.getBoundingClientRect().width;
    const avail = containingWidth(el);
    // Only when the element is genuinely unconstrained. An image that already
    // carries max-width and still lands a few px over is sub-pixel rounding
    // or a border, not the missing-reset defect this check is for.
    if (avail > 0 && w > avail + 2 && cs.maxWidth === 'none') {
      findings.intrinsicOverflow.push(
        `${sel(el)} renders ${Math.round(w)}px in ${Math.round(avail)}px (no max-width)`
      );
    }
  }

  // 2. Anything past the document edge, named. The old boolean said a page
  //    was broken without saying where.
  const docWidth = document.documentElement.clientWidth;
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;
    if (rect.right <= docWidth + 1 && rect.left >= -1) continue;

    // Nearest clipping ancestor. If one exists and does not scroll, the
    // overflow is being hidden rather than scrolled -- which is worse, not
    // better: the content is cut off and unreachable.
    let clipper = null;
    let parent = el.parentElement;
    while (parent && parent !== document.documentElement) {
      const pcs = getComputedStyle(parent);
      if (['hidden', 'clip', 'auto', 'scroll'].includes(pcs.overflowX)) {
        clipper = { node: parent, scrollable: pcs.overflowX === 'auto' || pcs.overflowX === 'scroll' };
        break;
      }
      parent = parent.parentElement;
    }

    if (!clipper) {
      findings.horizontalScrollCulprits.push(
        `${sel(el)} right edge ${Math.round(rect.right)}px past ${docWidth}px`
      );
    } else if (!clipper.scrollable) {
      // A marquee is an over-wide track translating inside a clipped window,
      // which is structurally identical to content being cut off. The
      // difference is that a ticker is animated, so exempt a track that is
      // running an animation -- otherwise every kinetic-ticker site in the
      // repo reports a defect on every device.
      let animated = false;
      for (let node = el; node && node !== clipper.node.parentElement; node = node.parentElement) {
        if (getComputedStyle(node).animationName !== 'none') {
          animated = true;
          break;
        }
      }
      if (!animated) {
        findings.clippedByOverflowHidden.push(
          `${sel(el)} (${Math.round(rect.width)}px) cut off by ${sel(clipper.node)}`
        );
      }
    }
  }

  // 3. Grid tracks with a pixel floor wider than their container. auto-fit
  //    collapses the column count but never shrinks a minmax() floor, so
  //    minmax(300px, 1fr) overflows every phone narrower than ~364px.
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display !== 'grid' && cs.display !== 'inline-grid') continue;
    const avail = el.clientWidth - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0');
    if (avail <= 0) continue;
    // Computed grid-template-columns resolves to used px, so read the
    // authored value off the matching rule to see the floor as written.
    for (const rule of styleRules) {
      const authored = rule.style.getPropertyValue('grid-template-columns');
      if (!authored) continue;
      const floorMatch = authored.match(/minmax\(\s*(\d+)px/i);
      if (!floorMatch) continue;
      let matches = false;
      try {
        matches = el.matches(rule.selectorText);
      } catch {
        continue;
      }
      if (!matches) continue;
      const floor = Number(floorMatch[1]);
      if (floor > avail + 1) {
        findings.uncollapsibleTrack.push(
          `${sel(el)} minmax(${floor}px,...) floor exceeds ${Math.round(avail)}px container`
        );
      }
    }
  }

  // 4. Text that cannot wrap out of its box.
  //
  // HTML only: an SVG <text> has no CSS box to overflow, scrollWidth and
  // clientWidth do not mean there what they mean here, and overflow-wrap does
  // not apply to it. Without this guard every inline SVG label reports a
  // phantom overflow.
  const HTML_NS = 'http://www.w3.org/1999/xhtml';
  for (const el of document.querySelectorAll('body *')) {
    if (el.namespaceURI !== HTML_NS) continue;
    if (!hasDirectText(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (el.scrollWidth <= el.clientWidth + 1) continue;
    const over17 = el.scrollWidth - el.clientWidth;
    if (cs.whiteSpace === 'nowrap' || cs.whiteSpace === 'pre') {
      // nowrap inside a scroller or a clipped marquee track is intentional;
      // inside a static box it is a defect.
      const contained =
        cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowX === 'hidden' || cs.overflow === 'hidden';
      if (!contained) {
        findings.unbreakableText.push(`${sel(el)} white-space:${cs.whiteSpace} overflows by ${over17}px`);
      }
    } else {
      const canBreak =
        /break-word|anywhere/.test(cs.overflowWrap) ||
        /break-all|break-word/.test(cs.wordBreak) ||
        cs.hyphens === 'auto';
      if (!canBreak) {
        findings.unbreakableText.push(`${sel(el)} overflows by ${over17}px with no overflow-wrap`);
      }
    }
  }

  // 5. iOS zooms the page when a field under 16px takes focus and does not
  //    zoom back. Inputs do not inherit font-size, so this is easy to miss.
  if (isMobile) {
    for (const el of document.querySelectorAll('input, textarea, select')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || el.type === 'hidden') continue;
      const fs = parseFloat(cs.fontSize);
      if (fs && fs < 16) findings.iosZoomInputs.push(`${sel(el)} ${fs}px (needs >= 16px)`);
    }
  }

  // 5b. Form fields with no accessible name, and placeholders clipped by
  //     their own field. A placeholder is not a label: it disappears the
  //     moment anyone types, and a screen reader gets nothing. Both defects
  //     were on imperivm-spqr's report form and no gate saw either -- the
  //     alt-text check only covers images.
  for (const el of document.querySelectorAll('input, textarea, select')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || el.type === 'hidden' || el.type === 'submit' || el.type === 'button') continue;
    const labelled =
      el.getAttribute('aria-label') ||
      el.getAttribute('aria-labelledby') ||
      el.closest('label') ||
      (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`));
    if (!labelled) {
      const hint = el.getAttribute('placeholder');
      findings.unlabelledField.push(`${sel(el)}${hint ? ` (placeholder "${hint}" is not a label)` : ''}`);
    }
    // A single-line field clips rather than wraps, so an over-long
    // placeholder is cut mid-word with no way to read it.
    if (el.tagName !== 'TEXTAREA' && el.placeholder && el.scrollWidth > el.clientWidth + 1) {
      findings.clippedPlaceholder.push(`${sel(el)} "${el.placeholder}" clipped at ${Math.round(el.clientWidth)}px`);
    }
  }

  // 6. The viewport meta tag. Missing means desktop layout on a phone;
  //    user-scalable=no blocks pinch-zoom, a WCAG 1.4.4 failure.
  const vp = document.querySelector('meta[name="viewport"]');
  if (!vp) {
    findings.viewportMeta = 'missing <meta name="viewport">';
  } else {
    const content = (vp.getAttribute('content') || '').toLowerCase();
    if (!/width\s*=\s*device-width/.test(content)) {
      findings.viewportMeta = `viewport meta lacks width=device-width: "${content}"`;
    } else if (/user-scalable\s*=\s*(no|0)/.test(content) || /maximum-scale\s*=\s*1(\.0)?(\s|,|$)/.test(content)) {
      findings.viewportMeta = `viewport meta blocks zoom: "${content}"`;
    }
  }

  // 7. vh units on a touch device. Mobile browsers count the collapsed URL
  //    bar in vh, so a 100vh hero resizes mid-scroll. dvh/svh exist for this.
  if (hasTouch) {
    for (const rule of styleRules) {
      // html/body min-height:100vh only sets a floor for the page; there is
      // no locked box for the collapsing URL bar to squeeze. A section is the
      // case that actually resizes under the user mid-scroll.
      if (/^\s*(html|body)(\s*,\s*(html|body))*\s*$/i.test(rule.selectorText)) continue;
      for (const prop of ['height', 'min-height']) {
        const v = rule.style.getPropertyValue(prop);
        if (v && /\dvh(\s|;|$|\))/.test(`${v} `) && !/dvh|svh|lvh/.test(v)) {
          findings.viewportUnitRisk.push(`${rule.selectorText} { ${prop}: ${v} }`);
        }
      }
    }
  }

  // 8. A scrim built for a side-by-side desktop layout. A horizontal gradient
  //    fades out across the width, so once the text column goes full-bleed on
  //    a phone the end of every line sits over bare photograph.
  if (isMobile) {
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundImage;
      if (!bg || !/linear-gradient/i.test(bg)) continue;
      if (!/to\s+(right|left)|(^|[\s(])(90|270)deg/i.test(bg)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 120 || rect.height < 80) continue;
      const overMedia =
        /url\(/i.test(bg) ||
        mediaBoxes.some(
          (m) =>
            m.rect.left < rect.right && m.rect.right > rect.left && m.rect.top < rect.bottom && m.rect.bottom > rect.top
        );
      if (!overMedia) continue;
      const fullWidthText = [...el.querySelectorAll('*')].some(
        (c) => hasDirectText(c) && c.getBoundingClientRect().width > rect.width * 0.7
      );
      if (fullWidthText) {
        findings.directionalScrim.push(`${sel(el)} horizontal gradient scrim under full-width text`);
      }
    }
  }

  // 9. Tap targets that meet 44x44 individually but sit on top of each other.
  if (isMobile) {
    const targets = [
      ...document.querySelectorAll('a, button, input, select, textarea, [role="button"], [role="link"]'),
    ].filter((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      // Links inside a sentence are exempt (WCAG 2.5.8) and sit flush against
      // their neighbours by nature.
      if (cs.display === 'inline') return false;
      const r = el.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    });
    for (let i = 0; i < targets.length; i++) {
      for (let j = i + 1; j < targets.length; j++) {
        if (targets[i].contains(targets[j]) || targets[j].contains(targets[i])) continue;
        const a = targets[i].getBoundingClientRect();
        const b = targets[j].getBoundingClientRect();
        const dx = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
        const dy = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom));
        const gap = Math.sqrt(dx * dx + dy * dy);
        // Spacing is what compensates for a small target. Two comfortably
        // sized controls sitting flush -- stacked nav items, a button group --
        // are not a defect, so only flag a tight gap when one of the pair is
        // already under the 44px minimum.
        const undersized = (r) => r.width < 44 || r.height < 44;
        if (gap < 8 && (undersized(a) || undersized(b))) {
          findings.tapTargetSpacing.push(`${sel(targets[i])} and ${sel(targets[j])} ${gap.toFixed(1)}px apart`);
        }
      }
    }
  }

  // 10. Hover-only affordances on a touch device: a :hover rule that reveals
  //     something, with no :focus / :focus-visible / :focus-within twin, is
  //     unreachable by finger and by keyboard alike.
  if (hasTouch) {
    // Compare selector by selector, not rule by rule. The usual way this is
    // written well is one rule listing both states --
    // `.tile:hover img, .tile:focus-visible img` -- and stripping :hover from
    // the whole list yields a string that matches nothing, so a correctly
    // written rule reported itself as hover-only.
    // (Splitting on commas is wrong inside :is()/:where(); rare enough here.)
    const norm = (part) => part.replace(/\s+/g, ' ').trim();
    const focusBases = new Set();
    for (const rule of styleRules) {
      for (const part of rule.selectorText.split(',')) {
        if (/:focus(-visible|-within)?/.test(part)) {
          focusBases.add(norm(part.replace(/:focus(-visible|-within)?/g, '')));
        }
      }
    }
    for (const rule of styleRules) {
      // Only rules that actually reveal something, not decorative colour.
      const reveals = ['opacity', 'visibility', 'max-height', 'height', 'display', 'clip-path'].some((prop) =>
        rule.style.getPropertyValue(prop)
      );
      if (!reveals) continue;
      for (const part of rule.selectorText.split(',')) {
        if (!/:hover/.test(part)) continue;
        if (focusBases.has(norm(part.replace(/:hover/g, '')))) continue;
        findings.hoverOnlyAffordance.push(`${norm(part)} reveals on hover with no :focus equivalent`);
      }
    }
  }

  // 11. A full-screen fixed overlay that cannot scroll its own content traps
  //     anything taller than the viewport, and on touch the page scrolls
  //     behind it instead.
  for (const el of document.querySelectorAll('dialog, [class*="modal"], [class*="overlay"], [class*="lightbox"]')) {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed') continue;
    const r = el.getBoundingClientRect();
    const fullScreen = r.width >= window.innerWidth * 0.9 && r.height >= window.innerHeight * 0.9;
    const insetZero = ['top', 'right', 'bottom', 'left'].every((side) => parseFloat(cs[side] || '0') <= 1);
    if (!fullScreen && !insetZero) continue;
    if (cs.overflowY !== 'auto' && cs.overflowY !== 'scroll') {
      findings.modalScrollLock.push(`${sel(el)} fixed overlay, overflow-y:${cs.overflowY} (content cannot scroll)`);
    }
  }

  // 12. Bottom-anchored fixed UI vanishes under the home indicator without an
  //     env(safe-area-inset-bottom) allowance.
  if (hasTouch && !/safe-area-inset/.test(allCss)) {
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed') continue;
      const bottom = parseFloat(cs.bottom);
      if (!Number.isFinite(bottom) || bottom > 1) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 20) continue;
      findings.safeAreaInset.push(`${sel(el)} pinned to bottom with no env(safe-area-inset-bottom)`);
    }
  }

  // Cap the lists so one systemic defect cannot bury the report, but record
  // what was dropped: 25 contrast failures and 300 contrast failures used to
  // look identical here.
  const CAP = 25;
  for (const [key, value] of Object.entries(findings)) {
    if (!Array.isArray(value)) continue;
    const unique = [...new Set(value)];
    if (unique.length > CAP) findings.truncated[key] = unique.length - CAP;
    findings[key] = unique.slice(0, CAP);
  }
  return findings;
}

/**
 * Runs in the page under `prefers-reduced-motion: reduce`.
 *
 * Every site here hides its reveal targets at `opacity: 0` and shows them with
 * an IntersectionObserver. If the reduced-motion branch is missing, or its
 * override loses on specificity, the content never becomes visible and the
 * page is **blank** for that user. `check:contract` only greps the stylesheet
 * for the string `prefers-reduced-motion`, which an empty block satisfies, so
 * nothing in the repo could see this before.
 */
function collectReducedMotionFindings() {
  const findings = { revealStuckHidden: [], truncated: {} };

  const sel = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/)[0]}` : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`.slice(0, 120);
  };

  const hasText = (el) => (el.textContent || '').trim().length > 2;

  // Anything the motion system is responsible for revealing.
  const candidates = new Set([
    ...document.querySelectorAll('[data-reveal], [class*="reveal"], [class*="fade"], [class*="slide"]'),
  ]);
  // Plus anything holding real copy that is simply invisible.
  for (const el of document.querySelectorAll('section, article, div, p, h1, h2, h3, li, figure')) {
    if (hasText(el)) candidates.add(el);
  }

  for (const el of candidates) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') continue; // deliberately not rendered, e.g. a closed dialog
    if (!hasText(el)) continue;

    const opacity = Number(cs.opacity);
    const invisible = Number.isFinite(opacity) && opacity < 0.99;
    const hidden = cs.visibility === 'hidden';
    // A reveal parked off-screen by its transform never arrives either.
    const m = /matrix.*\((.+)\)/.exec(cs.transform);
    let shifted = false;
    if (m) {
      const parts = m[1].split(',').map(Number);
      const ty = parts.length === 6 ? parts[5] : parts.length === 16 ? parts[13] : 0;
      const tx = parts.length === 6 ? parts[4] : parts.length === 16 ? parts[12] : 0;
      shifted = Math.abs(ty) > 24 || Math.abs(tx) > 24;
    }
    // clip-path wipes park content at inset(100% ...) until the scroll driver runs.
    const clipped = /inset\(\s*(9\d|100)(\.\d+)?%/.test(cs.clipPath || '');

    if (invisible || hidden || shifted || clipped) {
      const why = invisible
        ? `opacity ${opacity}`
        : hidden
          ? 'visibility:hidden'
          : clipped
            ? `clip-path ${cs.clipPath}`
            : `transform ${cs.transform}`;
      findings.revealStuckHidden.push(`${sel(el)} still hidden under reduced motion (${why})`);
    }
  }

  // Only the outermost offender matters: if a section never reveals, every
  // child reports too and the list becomes noise.
  const outermost = [];
  const seenPrefix = new Set();
  for (const entry of findings.revealStuckHidden) {
    const key = entry.split(' still hidden')[0];
    if (seenPrefix.has(key)) continue;
    seenPrefix.add(key);
    outermost.push(entry);
  }
  const CAP = 25;
  if (outermost.length > CAP) findings.truncated.revealStuckHidden = outermost.length - CAP;
  findings.revealStuckHidden = outermost.slice(0, CAP);
  return findings;
}

/**
 * Landmarks and control names, read from the page.
 *
 * The repo's own accessibility rules require landmarks and an accessible name
 * on every control, and nothing has ever checked either. The commonest failure
 * here is a link or button whose only child is an icon or an `alt=""` image:
 * it has no name at all, so it is announced as "link" and nothing else.
 */
function collectStructureFindings() {
  const findings = { unnamedControl: [], missingLandmark: [], truncated: {} };

  const sel = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/)[0]}` : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`.slice(0, 120);
  };

  for (const role of ['main', 'header,[role="banner"]', 'footer,[role="contentinfo"]']) {
    if (!document.querySelector(role)) findings.missingLandmark.push(`no ${role.split(',')[0]} landmark`);
  }
  // A <nav> is only owed when there is navigation to wrap. Several of these
  // sites are deliberately single-page readouts with no link cluster at all,
  // and demanding an empty <nav> of them is cargo-cult, not accessibility.
  const navLinks = [...document.querySelectorAll('a[href]')].filter((a) => {
    const href = a.getAttribute('href') || '';
    // A bare "#" is a placeholder button, not navigation. Counting them made a
    // page with one real anchor and two placeholders look like a three-item nav.
    const inPage = href.startsWith('#') && href.length > 1;
    return (inPage || href.endsWith('.html')) && !a.closest('footer');
  });
  if (navLinks.length >= 2 && !document.querySelector('nav, [role="navigation"]')) {
    findings.missingLandmark.push(`${navLinks.length} navigation links with no <nav> landmark`);
  }

  const accessibleName = (el) => {
    const aria = el.getAttribute('aria-label');
    if (aria && aria.trim()) return aria.trim();
    const labelledby = el.getAttribute('aria-labelledby');
    if (labelledby) {
      const text = labelledby
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() || '')
        .join(' ')
        .trim();
      if (text) return text;
    }
    if (el.tagName === 'INPUT' && el.value && (el.type === 'submit' || el.type === 'button')) return el.value;
    const text = (el.textContent || '').trim();
    if (text) return text;
    // An image child can supply the name, but only if its alt is non-empty.
    for (const img of el.querySelectorAll('img')) {
      const alt = (img.getAttribute('alt') || '').trim();
      if (alt) return alt;
    }
    const title = el.getAttribute('title');
    return title && title.trim() ? title.trim() : '';
  };

  for (const el of document.querySelectorAll('a[href], button, [role="button"], [role="link"]')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 && r.height < 2) continue;
    if (!accessibleName(el)) {
      findings.unnamedControl.push(`${sel(el)} has no accessible name`);
    }
  }

  const CAP = 25;
  for (const [key, value] of Object.entries(findings)) {
    if (!Array.isArray(value)) continue;
    const unique = [...new Set(value)];
    if (unique.length > CAP) findings.truncated[key] = unique.length - CAP;
    findings[key] = unique.slice(0, CAP);
  }
  return findings;
}

/**
 * Reads the focus ring on whatever currently has focus.
 *
 * `outline: none` with no replacement is the single commonest accessibility
 * regression in this repo -- 38 of 89 stylesheets contain it -- and the rules
 * file has demanded a `:focus-visible` replacement since it was written.
 */
function describeFocus() {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  // Native media and embedded content paint their own focus affordance
  // through the UA control shadow DOM, which no computed style reports.
  const nativeRing = ['VIDEO', 'AUDIO', 'IFRAME', 'EMBED', 'OBJECT'].includes(el.tagName);
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const id = el.id ? `#${el.id}` : '';
  const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/)[0]}` : '';
  const outlineWidth = parseFloat(cs.outlineWidth) || 0;
  const hasOutline = cs.outlineStyle !== 'none' && outlineWidth > 0;
  const hasShadow = cs.boxShadow && cs.boxShadow !== 'none';
  const hasRing = cs.borderColor !== cs.backgroundColor && parseFloat(cs.borderWidth) > 0;
  return {
    selector: `${el.tagName.toLowerCase()}${id}${cls}`.slice(0, 120),
    visible: nativeRing || hasOutline || hasShadow || hasRing,
    // Off the top or bottom of the document flow entirely, or zero-sized.
    offscreen: r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > window.innerHeight * 4,
    top: Math.round(r.top + window.scrollY),
  };
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
  // Chrome refuses to encode a capture taller than 16384 *device* px, so at
  // DPR 2 the ceiling is ~8200 CSS px and most of these pages clear that on a
  // phone. qa_sweep.js has always clipped; this one did not, so a tall page
  // threw and took the whole run down with it.
  const CAPTURE_LIMIT_DEVICE_PX = 16384;
  const dpr = page.viewport()?.deviceScaleFactor ?? 1;
  const maxCssHeight = Math.floor(CAPTURE_LIMIT_DEVICE_PX / dpr);
  if (pageHeight > maxCssHeight) {
    await page.screenshot({
      path: join(outDir, 'full.png'),
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: bp.width, height: maxCssHeight },
    });
    console.warn(
      `  ${bp.label}: page is ${pageHeight}px; full.png clipped to ${maxCssHeight}px (the tiles cover the rest)`
    );
  } else {
    await page.screenshot({ path: join(outDir, 'full.png'), fullPage: true });
  }
  const overlapPct = count > 1 ? Math.round((1 - step / bp.height) * 100) : Math.round(TILE_OVERLAP * 100);
  return { tiles, pageHeight, step, overlapPct, thinOverlap: overlapPct < 5 };
}

/** Scripted walkthrough: what a visitor does, at a pace a human can watch. */
async function recordWalkthrough(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const outPath = join(REC_ROOT, `${slug}-walkthrough.webm`);
  await gotoWithRetry(page, url, 'walkthrough');
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

/**
 * A page carrying an autoplaying video can hold networkidle2 open past the
 * 30s default, and a phone emulation at DPR 2 is slower still. qa_sweep
 * already allows 90s and retries once; this pass had neither and simply threw.
 */
const NAV_TIMEOUT_MS = 90_000;

async function gotoWithRetry(page, url, label) {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT_MS });
  } catch (err) {
    const retryable = /ERR_ABORTED|Target closed|Navigation timeout/.test(String(err?.message || err));
    if (!retryable) throw err;
    console.warn(`  ${label}: ${err.message} - retrying once with a looser wait...`);
    await new Promise((r) => setTimeout(r, 1500));
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
    // domcontentloaded can land before late media; give the page a moment.
    await new Promise((r) => setTimeout(r, 2500));
  }
}

/** Total findings in one device's result, arrays and booleans alike. */
function countFindings(findings) {
  let n = 0;
  for (const [key, value] of Object.entries(findings)) {
    if (key === 'truncated') continue;
    if (Array.isArray(value)) n += value.length;
    else if (value) n += 1;
  }
  return n;
}

// --- main --------------------------------------------------------------------
let server = null;
let browser = null;
let exitCode = 0;

(async () => {
  try {
    if (!existsSync(join(ROOT, 'dist'))) {
      console.error('VISUAL_QA_FAIL: dist/ not found — run `npm run build` first.');
      console.error('  (Existing sheets left untouched.)');
      process.exit(1);
    }

    rmSync(join(ROOT, 'qa-visual-report.json'), { force: true });
    cleanupPreviousRun();

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

    // Reset target for applyDevice, so a desktop device never inherits the
    // mobile UA set by the device before it.
    const defaultUserAgent = await browser.userAgent();

    console.log(`Devices (${DEVICES.length}): ${DEVICES.map(describeDevice).join(', ')}`);

    const report = {
      generatedAt: new Date().toISOString(),
      slug,
      // Binds this evidence to the bytes it was gathered from, so a review of
      // it cannot outlive the source it approved.
      sourceDigest: siteSourceDigest(site.absolutePath),
      devices: DEVICES.map((d) => ({ key: d.key, ...d.viewport })),
      pages: [],
      recording: null,
      sheets: [],
    };
    const manifest = [];

    const capturePage = async (pagePath) => {
      const url = new URL(pagePath, PREVIEW_URL).href;
      const pageKey = pagePath
        .replace(/^sites\//, '')
        .replace(/\//g, '__')
        .replace(/\.html$/, '');
      const entry = { path: pagePath, url, devices: {} };
      console.log(`\n${pagePath}`);

      const page = await browser.newPage();
      try {
        for (const device of DEVICES) {
          const bp = { label: device.key, height: device.viewport.height, width: device.viewport.width };
          await applyDevice(page, device, defaultUserAgent);
          await gotoWithRetry(page, url, `${pagePath} @${device.key}`);
          await settlePage(page);

          const findings = await page.evaluate(collectVisualFindings, {
            isMobile: device.viewport.isMobile,
            hasTouch: device.viewport.hasTouch,
          });
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

          const issueCount = countFindings(findings);

          entry.devices[bp.label] = {
            viewport: `${device.viewport.width}x${device.viewport.height}`,
            hasTouch: device.viewport.hasTouch,
            findings,
            tiles: shots.tiles.length,
            pageHeight: shots.pageHeight,
            overlapPct: shots.overlapPct,
            thinOverlap: shots.thinOverlap,
          };
          console.log(
            `  ${bp.label.padEnd(17)} ${String(shots.tiles.length).padStart(2)} tiles  ${issueCount} finding(s)`
          );
          if (shots.thinOverlap) {
            console.warn(
              `  ${bp.label}: ${shots.pageHeight}px spread over ${MAX_TILES} tiles — only ${shots.overlapPct}% overlap`
            );
          }
        }

        // One extra pass with reduced motion actually turned on. This is a
        // CSS/JS behaviour rather than a layout one, so a single viewport is
        // enough; it records as its own pseudo-device so the existing blocker
        // gate picks it up with no special casing.
        const rmDevice = DEVICES.find((d) => d.key === 'desktop-1440') ?? DEVICES[0];
        await applyDevice(page, rmDevice, defaultUserAgent);
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
        await gotoWithRetry(page, url, `${pagePath} @reduced-motion`);
        await settlePage(page);
        const rmFindings = await page.evaluate(collectReducedMotionFindings);
        entry.devices['reduced-motion'] = {
          viewport: `${rmDevice.viewport.width}x${rmDevice.viewport.height}`,
          hasTouch: false,
          findings: rmFindings,
          tiles: 0,
          pageHeight: 0,
          overlapPct: 0,
          thinOverlap: false,
          // Evidence rules exempt this pass: it asserts behaviour, and a
          // screenshot of it is captured into the sheets separately.
          evidenceExempt: true,
        };
        if (opts.tiles) {
          const rmDir = join(slugShotDir, pageKey, 'reduced-motion');
          mkdirSync(rmDir, { recursive: true });
          await page.screenshot({ path: join(rmDir, 'tile-01.png') });
        }
        console.log(
          `  ${'reduced-motion'.padEnd(17)} ${String(rmFindings.revealStuckHidden.length).padStart(2)} stuck element(s)`
        );
        await page.emulateMediaFeatures([]);

        // --- interaction pass: names, keyboard, and the modal --------------
        //
        // Three surfaces that had no coverage at all. The modal one matters
        // most: nine sites declare `videoPlacement: "modal feature"`, whose
        // spec demands keyboard-operable, focus-trapped and Escape-dismissible,
        // and the overlay was never once opened, screenshotted or tested.
        const ixDevice = DEVICES.find((d) => d.key === 'desktop-1440') ?? DEVICES[0];
        await applyDevice(page, ixDevice, defaultUserAgent);
        await gotoWithRetry(page, url, `${pagePath} @interaction`);
        await settlePage(page);
        await page.evaluate(() => window.scrollTo(0, 0));

        const ixFindings = await page.evaluate(collectStructureFindings);
        ixFindings.invisibleFocus = [];
        ixFindings.focusOffscreen = [];
        ixFindings.modalIssues = [];

        const ixDir = join(slugShotDir, pageKey, 'interaction');
        if (opts.tiles) mkdirSync(ixDir, { recursive: true });
        let shot = 0;

        // Tab through the document, recording each ring.
        const MAX_TAB_STOPS = 25;
        const seenStops = new Set();
        let firstStop = null;
        let stops = 0;
        for (let i = 0; i < MAX_TAB_STOPS; i++) {
          await page.keyboard.press('Tab');
          const state = await page.evaluate(describeFocus);
          if (!state) break;
          // Stop when focus wraps back to the first control rather than
          // de-duplicating by selector: six nav links share one class, and
          // collapsing them reported a six-link nav as a single tab stop.
          if (firstStop === null) firstStop = state.selector;
          else if (state.selector === firstStop && stops > 1) break;
          stops++;
          seenStops.add(state.selector);
          if (!state.visible) ixFindings.invisibleFocus.push(`${state.selector} has no visible focus ring`);
          if (state.offscreen) ixFindings.focusOffscreen.push(`${state.selector} focused while not visible`);
          if (opts.tiles && shot < 9) {
            await page.screenshot({ path: join(ixDir, `tile-${String(++shot).padStart(2, '0')}.png`) });
          }
        }

        // Open whatever overlay this page has, if any.
        const modal = await page.evaluate(() => {
          const overlay = [...document.querySelectorAll('dialog, [class*="modal"], [class*="lightbox"]')].find((el) =>
            ['fixed', 'absolute'].includes(getComputedStyle(el).position)
          );
          if (!overlay) return null;

          const usable = (el) => {
            if (!el) return false;
            const cs = getComputedStyle(el);
            return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getBoundingClientRect().width > 8;
          };

          // Preference order, not DOM order. A plain `button` match came first
          // in document order and picked the hero CTA, so the real trigger was
          // never clicked and every modal site reported a false defect.
          const candidates = [
            overlay.id ? `[aria-controls="${overlay.id}"]` : null,
            '[data-modal-open]',
            '[data-modal]',
            '[class*="modal-trigger"]',
            '[class*="trigger"]',
            '[class*="play"]',
          ].filter(Boolean);

          let trigger = null;
          for (const selector of candidates) {
            trigger = [...document.querySelectorAll(selector)].find(usable);
            if (trigger) break;
          }
          if (!trigger) return { hasTrigger: false };
          trigger.setAttribute('data-qa-modal-trigger', '');
          overlay.setAttribute('data-qa-modal', '');
          return { hasTrigger: true };
        });

        if (modal && !modal.hasTrigger) {
          // Not a site defect: the overlay exists but this harness could not
          // identify what opens it. Advisory, so it never blocks a ship.
          ixFindings.modalNotDriven = ['overlay found but no recognisable trigger — open it by hand when reviewing'];
        } else if (modal) {
          const isOpen = () =>
            page.evaluate(() => {
              const el = document.querySelector('[data-qa-modal]');
              if (!el) return false;
              const cs = getComputedStyle(el);
              return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.05;
            });

          await page.click('[data-qa-modal-trigger]').catch(() => {});
          await new Promise((r) => setTimeout(r, 600));
          if (await isOpen()) {
            if (opts.tiles && shot < 12) {
              await page.screenshot({ path: join(ixDir, `tile-${String(++shot).padStart(2, '0')}.png`) });
            }
            // Focus should not be able to walk out of an open dialog.
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');
            const inside = await page.evaluate(
              () => !!document.activeElement?.closest('[data-qa-modal]') || document.activeElement === document.body
            );
            if (!inside) ixFindings.modalIssues.push('focus escapes the open overlay (no focus trap)');

            await page.keyboard.press('Escape');
            await new Promise((r) => setTimeout(r, 500));
            if (await isOpen()) ixFindings.modalIssues.push('overlay does not close on Escape');
          } else {
            ixFindings.modalNotDriven = ['trigger did not open the overlay — open it by hand when reviewing'];
          }
        }

        entry.devices.interaction = {
          viewport: `${ixDevice.viewport.width}x${ixDevice.viewport.height}`,
          hasTouch: false,
          findings: ixFindings,
          tiles: shot,
          pageHeight: 0,
          overlapPct: 0,
          thinOverlap: false,
          evidenceExempt: true,
        };
        console.log(
          `  ${'interaction'.padEnd(17)} ${String(stops).padStart(2)} tab stop(s), ` +
            `${ixFindings.invisibleFocus.length} invisible focus, ${ixFindings.modalIssues.length} modal issue(s)`
        );
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

    // --- contact sheets: the artifacts the agent can actually look at -------
    //
    // ~60 tiles per site across ten devices is not reviewable one file at a
    // time, and the walkthrough is a .webm that an agent cannot open at all.
    // Compositing both into a handful of labelled sheets is what makes the
    // Extreme Visual Audit a thing that can be performed rather than claimed.
    if (opts.sheets && opts.tiles) {
      console.log('\nBuilding contact sheets...');
      report.sheets = await buildContactSheets({
        root: ROOT,
        slug,
        shotDir: slugShotDir,
        pages: report.pages,
        recording: report.recording,
      });
      for (const sheet of report.sheets) console.log(`  -> ${sheet.path} (${sheet.kind})`);
    }

    // --- totals -------------------------------------------------------------
    const totals = { tiles: 0, findings: {}, truncated: 0 };
    for (const p of report.pages) {
      for (const data of Object.values(p.devices)) {
        totals.tiles += data.tiles;
        for (const [k, v] of Object.entries(data.findings)) {
          if (k === 'truncated') continue;
          const n = Array.isArray(v) ? v.length : v ? 1 : 0;
          if (n) totals.findings[k] = (totals.findings[k] ?? 0) + n;
        }
        for (const n of Object.values(data.findings.truncated ?? {})) totals.truncated += n;
      }
    }
    const findingTotal = Object.values(totals.findings).reduce((a, b) => a + b, 0);

    // --- refuse to report on evidence that was never gathered ----------------
    //
    // This script used to write `tiles: 0, pageHeight: 0` with empty findings
    // and exit 0 — a clean verdict on nothing at all, which is how sites with
    // no screenshots reached SHIP_PASS. Missing evidence is now a failure.
    const evidenceProblems = [];
    if (opts.tiles) {
      for (const p of report.pages) {
        for (const [key, data] of Object.entries(p.devices)) {
          if (data.evidenceExempt) continue;
          if (data.tiles === 0 || data.pageHeight === 0) {
            evidenceProblems.push(`${p.path} @${key}: ${data.tiles} tiles, page height ${data.pageHeight}px`);
          }
        }
      }
    }
    if (opts.record && canRecord && !report.recording) {
      evidenceProblems.push('walkthrough recording missing although ffmpeg is available');
    }

    // --- MANIFEST.json: what check:vision hashes the review against ----------
    const sheetEntries = report.sheets.map((sheet) => {
      const abs = join(ROOT, sheet.path);
      return {
        path: sheet.path,
        kind: sheet.kind,
        caption: sheet.caption,
        sha256: createHash('sha256').update(readFileSync(abs)).digest('hex'),
      };
    });
    const rollup = createHash('sha256');
    rollup.update(report.sourceDigest);
    for (const entry of sheetEntries) rollup.update(`${entry.path}\0${entry.sha256}\0`);
    const manifestDoc = {
      generatedAt: report.generatedAt,
      slug,
      sourceDigest: report.sourceDigest,
      digest: rollup.digest('hex'),
      sheets: sheetEntries,
      tiles: totals.tiles,
      findings: totals.findings,
      devices: DEVICES.map((d) => d.key),
    };
    writeFileSync(join(slugShotDir, 'MANIFEST.json'), `${JSON.stringify(manifestDoc, null, 2)}\n`, 'utf8');

    // --- INDEX.md: the artifact list the agent is held to reviewing ---------
    const lines = [
      `# Visual QA artifacts — ${slug}`,
      '',
      `Generated ${report.generatedAt}`,
      '',
      `${totals.tiles} tiles across ${report.pages.length} page(s) and ${DEVICES.length} devices` +
        `${report.recording ? ', plus one walkthrough recording' : ''}.`,
      '',
      '## Review these',
      '',
    ];
    if (sheetEntries.length) {
      lines.push(
        'Read every sheet below with your own eyes, then record the result in',
        `\`audit/visual-reviews/${slug}.md\`. \`npm run check:vision -- ${slug}\` verifies that the`,
        'review exists, covers every sheet, and was written against these exact bytes.',
        ''
      );
      for (const entry of sheetEntries) lines.push(`- \`${entry.path}\` — ${entry.caption}`);
      lines.push('');
    } else {
      lines.push('- no contact sheets were built (run without `--no-sheets`/`--no-tiles`).', '');
    }

    lines.push('## Automated findings', '');
    if (Object.keys(totals.findings).length) {
      for (const [k, v] of Object.entries(totals.findings)) lines.push(`- \`${k}\`: ${v}`);
      if (totals.truncated) lines.push(`- _(${totals.truncated} further finding(s) capped out of the lists)_`);
      lines.push('', 'Details per page/device in `qa-visual-report.json`.');
    } else {
      lines.push('- none — the heuristics found nothing. This does **not** substitute for reviewing the sheets.');
    }

    lines.push('', '## Source tiles', '');
    for (const p of report.pages) {
      lines.push(`### ${p.path}`, '');
      const pageKey = p.path
        .replace(/^sites\//, '')
        .replace(/\//g, '__')
        .replace(/\.html$/, '');
      for (const [key, data] of Object.entries(p.devices)) {
        // Only list what was actually written. --no-tiles used to emit an
        // index full of full.png paths that had never been created.
        if (!data.tiles) {
          lines.push(`- **${key}** (${data.viewport}) — no tiles captured`);
          continue;
        }
        lines.push(`- **${key}** (${data.viewport}) — ${data.tiles} tiles, page height ${data.pageHeight}px`);
        for (let i = 1; i <= data.tiles; i++) {
          lines.push(`  - \`qa-screenshots/${slug}/${pageKey}/${key}/tile-${String(i).padStart(2, '0')}.png\``);
        }
        lines.push(`  - \`qa-screenshots/${slug}/${pageKey}/${key}/full.png\``);
      }
      lines.push('');
    }
    if (report.recording) {
      lines.push(
        '### Walkthrough recording',
        '',
        `- \`${report.recording}\` — frames extracted into the walkthrough sheet above.`,
        ''
      );
    }

    writeFileSync(join(slugShotDir, 'INDEX.md'), `${lines.join('\n')}\n`, 'utf8');
    writeFileSync(join(ROOT, 'qa-visual-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    // Blocker-class findings fail the run. Round 1 wrote these checks and then
    // let every one of them pass silently; a report is not a verdict unless
    // something acts on it.
    const blockers = visualBlockers(report);
    if (blockers.length) {
      const total = blockers.reduce((n, b) => n + b.count, 0);
      console.error(
        `
VISUAL_QA_FAIL: ${total} blocking finding(s) across ${blockers.length} device/page pair(s):`
      );
      for (const b of blockers) {
        console.error(`  ${b.path} @${b.device} ${b.key} (${b.count})`);
        for (const sample of b.samples) console.error(`      ${sample}`);
      }
      console.error('Evidence and sheets were still written; fix these and re-run.');
      exitCode = 1;
    }

    if (evidenceProblems.length) {
      console.error(`\nVISUAL_QA_FAIL: ${evidenceProblems.length} device/page pair(s) produced no evidence:`);
      for (const problem of evidenceProblems) console.error(`  ${problem}`);
      console.error('A report with no screenshots behind it is not a clean result.');
      exitCode = 1;
      return;
    }

    if (exitCode !== 0) {
      console.error(`\nVISUAL_QA_FAIL: sheets written to qa-screenshots/${slug}/sheets/ for diagnosis.`);
      return;
    }

    console.log(`\nVISUAL_QA_OK: ${totals.tiles} tiles, ${sheetEntries.length} sheet(s), ${findingTotal} heuristic finding(s)`);
    console.log(`  sheets:   qa-screenshots/${slug}/INDEX.md`);
    console.log(`  manifest: qa-screenshots/${slug}/MANIFEST.json (digest ${manifestDoc.digest.slice(0, 12)})`);
    console.log('  report:   qa-visual-report.json');
    console.log(`\nNow look at the sheets, then write audit/visual-reviews/${slug}.md.`);
    console.log(`check:ship will not pass until npm run check:vision -- ${slug} does.`);
  } catch (err) {
    console.error('VISUAL_QA_FAIL:', err);
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopPreviewServer(server);
    process.exit(exitCode);
  }
})();
