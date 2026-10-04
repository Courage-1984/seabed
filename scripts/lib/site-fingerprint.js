/**
 * Reads what a site actually shipped -- its :root palette and its Google Fonts --
 * so rotation is checked against the build, not against what a brief claimed.
 *
 * The palette is reduced to a coarse signature, e.g. "light|ink-blue|orange":
 *   bg       lightness mode (OKLab L), plus a hue bucket when the ground is tinted
 *   primary  "ink-<hue>" for dark primaries, "pale-<hue>" for very light ones, else a hue bucket
 *   accent   hue bucket, or "neutral" when it has almost no chroma
 *
 * Coarse on purpose. Thirty consecutive sites shipped a light grey ground, a
 * navy-ink primary and an amber accent with slightly different numbers each
 * time; an exact-value comparison saw thirty different palettes. A weighted
 * colour distance was tried and rejected -- dark primaries and pale grounds hide
 * hue, so it could not separate those sites from genuinely different ones.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Token names, in preference order. New sites must use the first name of each (see check-site-contract). */
export const PALETTE_TOKENS = {
  bg: ['color-bg', 'color-background', 'color-bg-primary', 'color-bg-base'],
  text: ['color-text', 'color-text-main', 'color-ink'],
  /** `color-text-primary` last: early sites had no brand primary, only a text ink. */
  primary: ['color-primary', 'color-ink', 'color-brand', 'color-text-primary'],
  accent: ['color-accent'],
};

/** The four tokens every site created on/after the rotation cutoff must declare by exactly these names. */
export const REQUIRED_PALETTE_TOKENS = ['color-bg', 'color-text', 'color-primary', 'color-accent'];

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** First declaration of each custom property across every plain `:root { }` block. */
export function parseRootVars(css) {
  const vars = {};
  const src = stripComments(css);
  for (const block of src.matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const m of block[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
      if (!(m[1] in vars)) vars[m[1]] = m[2].trim();
    }
  }
  // Resolve var(--x) chains, a few hops at most.
  for (const key of Object.keys(vars)) {
    let v = vars[key];
    for (let hop = 0; hop < 5; hop++) {
      const ref = /^var\(\s*--([\w-]+)\s*(?:,\s*([^)]+))?\)$/.exec(v);
      if (!ref) break;
      v = vars[ref[1]] ?? ref[2]?.trim() ?? v;
    }
    vars[key] = v;
  }
  return vars;
}

export function readRootVars(siteDir) {
  const cssPath = join(siteDir, 'style.css');
  return existsSync(cssPath) ? parseRootVars(readFileSync(cssPath, 'utf8')) : {};
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/** hex / hsl() / rgb() -> [r, g, b] in 0..255, or null. */
export function parseColor(value) {
  if (!value) return null;
  const v = String(value).trim();
  let m = /^#([0-9a-f]{3,8})\b/i.exec(v);
  if (m) {
    let hex = m[1];
    if (hex.length === 3 || hex.length === 4) hex = [...hex.slice(0, 3)].map((c) => c + c).join('');
    if (hex.length !== 6 && hex.length !== 8) return null;
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }
  m = /^hsla?\(\s*(-?[\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/i.exec(v);
  if (m) return hslToRgb(Number(m[1]), Number(m[2]) / 100, Number(m[3]) / 100);
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(v);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return null;
}

/** sRGB 0..255 -> OKLab [L, a, b]. Perceptually even, so distances between colours mean something. */
export function toOklab([r, g, b]) {
  const lin = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLab lightness, 0..1. Unlike HSL lightness it rates a vivid yellow as light and a saturated blue as dark. */
const oklabL = (rgb) => toOklab(rgb)[0];

/** HSL hue (degrees) and chroma on a 0..100 scale. */
function hueChroma([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { hue: h, chroma: (d / 255) * 100 };
}

/** Upper bounds. 15-50 is deliberately ONE bucket: the whole amber/orange/safety cluster lands in it. */
const FINE_BUCKETS = [
  [15, 'red'],
  [50, 'orange'],
  [70, 'yellow'],
  [100, 'lime'],
  [150, 'green'],
  [185, 'teal'],
  [205, 'cyan'],
  [245, 'blue'],
  [280, 'violet'],
  [320, 'purple'],
  [345, 'pink'],
  [360, 'red'],
];
const fineBucket = (h) => FINE_BUCKETS.find(([max]) => h < max)[1];

/** For inks and pales, where hue is hard to see and fine buckets would split near-identical colours. */
function coarseBucket(h) {
  if (h >= 330 || h < 70) return 'warm';
  if (h < 165) return 'green';
  if (h < 200) return 'teal';
  if (h < 260) return 'blue';
  return 'violet';
}

function lightnessMode(L) {
  if (L >= 0.8) return 'light';
  if (L <= 0.4) return 'dark';
  return 'mid';
}

function describeBg(rgb) {
  const L = oklabL(rgb);
  const { hue, chroma } = hueChroma(rgb);
  const mode = lightnessMode(L);
  if (chroma < 6) return mode;
  return `${mode}-${mode === 'mid' ? fineBucket(hue) : coarseBucket(hue)}`;
}

function describePrimary(rgb) {
  const L = oklabL(rgb);
  const { hue, chroma } = hueChroma(rgb);
  if (chroma < 4) return L <= 0.4 ? 'ink' : L >= 0.85 ? 'pale' : 'grey';
  if (L <= 0.4) return `ink-${coarseBucket(hue)}`;
  if (L >= 0.85) return `pale-${coarseBucket(hue)}`;
  return fineBucket(hue);
}

function describeAccent(rgb) {
  const { hue, chroma } = hueChroma(rgb);
  return chroma < 8 ? 'neutral' : fineBucket(hue);
}

const firstToken = (vars, names) => names.map((n) => vars[n]).find((v) => parseColor(v));

/** First `--color-accent*` that is a base colour, not a state or an on-surface variant. */
function accentValue(vars) {
  const direct = firstToken(vars, PALETTE_TOKENS.accent);
  if (direct) return direct;
  const key = Object.keys(vars).find(
    (k) => k.startsWith('color-accent') && !/hover|focus|active|on-|-on\b/.test(k) && parseColor(vars[k])
  );
  return key ? vars[key] : null;
}

/** The ground, primary and accent as [r, g, b] (each null when not found). */
export function paletteColors(vars) {
  return {
    bg: parseColor(firstToken(vars, PALETTE_TOKENS.bg)),
    primary: parseColor(firstToken(vars, PALETTE_TOKENS.primary)),
    accent: parseColor(accentValue(vars)),
  };
}

/**
 * @returns {{ bg: string, primary: string, accent: string, base: string, signature: string } | null}
 *   null when the ground or primary cannot be found.
 */
export function paletteFingerprint(vars) {
  const { bg, primary, accent } = paletteColors(vars);
  if (!bg || !primary) return null;
  const fp = {
    bg: describeBg(bg),
    primary: describePrimary(primary),
    accent: accent ? describeAccent(accent) : 'none',
  };
  fp.base = `${fp.bg}|${fp.primary}`;
  fp.signature = `${fp.base}|${fp.accent}`;
  return fp;
}

/** Palette fingerprint of three colour strings -- used to derive a style family's expected base. */
export function fingerprintColors({ bg, primary, accent }) {
  return paletteFingerprint({ 'color-bg': bg, 'color-primary': primary, 'color-accent': accent });
}

function listFiles(dir, ext, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'assets' || entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, ext, out);
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

/** Font families named in a Google Fonts URL query (css2 and the legacy `family=A|B` form). */
function familiesFromQuery(query) {
  const out = [];
  for (const param of query.replace(/&amp;/g, '&').split('&')) {
    if (!param.startsWith('family=')) continue;
    let raw = param.slice('family='.length);
    try {
      raw = decodeURIComponent(raw);
    } catch {
      /* keep raw */
    }
    for (const fam of raw.split('|')) {
      const name = fam.split(':')[0].replace(/\+/g, ' ').trim();
      if (name) out.push(name);
    }
  }
  return out;
}

/** Every font family the site loads, in first-seen order. */
export function extractFonts(siteDir) {
  const found = [];
  const add = (name) => {
    if (name && !found.includes(name)) found.push(name);
  };
  const sources = [...listFiles(siteDir, '.html'), ...listFiles(siteDir, '.css')].map((f) => readFileSync(f, 'utf8'));
  for (const src of sources) {
    for (const m of src.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'\s)>]+)/g)) {
      familiesFromQuery(m[1]).forEach(add);
    }
  }
  if (!found.length) {
    // Self-hosted fonts.
    for (const src of sources) {
      for (const m of stripComments(src).matchAll(/@font-face\s*\{[^}]*font-family\s*:\s*["']?([^;"']+)["']?/g)) {
        add(m[1].trim());
      }
    }
  }
  return found;
}

/** @returns {{ fonts: string[], palette: ReturnType<typeof paletteFingerprint>, vars: Record<string,string> }} */
export function siteFingerprint(siteDir) {
  const vars = readRootVars(siteDir);
  return { fonts: extractFonts(siteDir), palette: paletteFingerprint(vars), vars };
}
