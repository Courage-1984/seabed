/**
 * Canonical visual style families for meta.styleFamily and brief §5 / §6 / §7.
 *
 * The Variety Engine used to roll layout, video slot and effect but left palette
 * and type to the brief writer's taste. Its taste converged: 30 of 31 sites from
 * 2026-08-14 shipped a light grey ground, a navy-ink primary and an amber accent,
 * with the same handful of grotesks. Layout names rotated; the look did not.
 * A style family is the missing dimension -- palette direction, type class,
 * surface motifs and imagery -- rolled and rotated like everything else.
 *
 * Rotation is EQUAL: every run of 14 sites uses all 14 families exactly once,
 * in a fresh random order (scripts/lib/rotation.js). No family is special.
 *
 * `sample` is an internal reference palette, used only to derive the family's
 * expected palette base (check-variety warns when a site claims a family but
 * ships a palette that fingerprints elsewhere). It is not printed in the brief:
 * the brief carries the prose direction so two sites in one family still differ.
 *
 * Font pairings never repeat across families. Keep in sync with the brief
 * prompt's Visual style family table.
 */
import { fingerprintColors, paletteColors, paletteFingerprint, parseColor, toOklab } from './site-fingerprint.js';

/** A family may not recur within this many sites -- across a cycle boundary too. */
export const STYLE_BAN_WINDOW = 7;

/** The palette base 30 of 31 sites converged on. Allowed only for the family that owns it. */
export const ATTRACTOR_BASE = 'light|ink-blue';
export const ATTRACTOR_FAMILY = 'industrial safety-signage';

export const STYLE_FAMILY_SPECS = [
  {
    name: 'industrial safety-signage',
    mode: 'light',
    palette: 'Cool concrete grey ground, navy-ink primary, one safety amber or signal yellow accent.',
    sample: { bg: 'hsl(210, 10%, 92%)', primary: 'hsl(215, 25%, 12%)', accent: 'hsl(42, 95%, 45%)' },
    type: 'Condensed or heavy grotesque display with a utilitarian mono.',
    fonts: [
      ['Chivo', 'Chivo Mono'],
      ['Barlow Condensed', 'Overpass Mono'],
      ['Big Shoulders Display', 'Martian Mono'],
    ],
    motifs: 'Hazard striping, stencil numerals, hard 2px rules, square CTAs.',
    imagery: 'Documentary site photography, overcast light, real wear and grime.',
    forbid: 'Pairing with brutalist stacked, terminal / data-readout or kinetic ticker / marquee bands.',
    excludeLayouts: ['brutalist stacked', 'terminal / data-readout', 'kinetic ticker / marquee bands'],
  },
  {
    name: 'swiss international',
    mode: 'light',
    palette: 'Pure white ground, true black type, exactly one signal red used sparingly.',
    sample: { bg: '#ffffff', primary: 'hsl(0, 0%, 6%)', accent: 'hsl(4, 85%, 48%)' },
    type: 'Neo-grotesque at extreme size contrast; flush-left, ragged-right.',
    fonts: [
      ['Schibsted Grotesk', 'Geist Mono'],
      ['Archivo', 'Archivo Narrow'],
      ['Host Grotesk', 'Reddit Mono'],
    ],
    motifs: 'Huge numerals, thick black rules, asymmetric modular grid, generous negative space.',
    imagery: 'Clean objective product and architecture photography, hard daylight, no filters.',
    forbid: 'Hairline-ruled dense columns (broadsheet anti-pattern); more than one accent colour.',
    excludeLayouts: ['editorial magazine', 'index / ledger'],
  },
  {
    name: 'riso spot-ink',
    mode: 'light',
    palette: 'Tinted uncoated paper ground (pale lemon or blush), riso federal blue, fluorescent pink.',
    sample: { bg: 'hsl(48, 60%, 92%)', primary: 'hsl(222, 70%, 42%)', accent: 'hsl(330, 95%, 60%)' },
    type: 'Chunky expressive grotesque with a typewriter-ish mono.',
    fonts: [
      ['Bricolage Grotesque', 'DM Mono'],
      ['Darker Grotesque', 'Azeret Mono'],
      ['Rubik Mono One', 'Rubik'],
    ],
    motifs: 'Two-ink overprint with mix-blend-mode: multiply, slight misregistration offsets, halftone dots.',
    imagery: 'Two-colour halftone duotones of photographs; zine and poster energy.',
    forbid: 'Full-colour photography; drop shadows; more than two inks plus paper.',
    excludeLayouts: [],
  },
  {
    name: 'botanical plate',
    mode: 'light',
    palette: 'Pale sage ground, deep forest-ink primary, madder or berry accent.',
    sample: { bg: 'hsl(95, 30%, 87%)', primary: 'hsl(150, 35%, 16%)', accent: 'hsl(340, 60%, 38%)' },
    type: 'Old-style or display serif with a quiet humanist sans.',
    fonts: [
      ['Gloock', 'Karla'],
      ['Libre Caslon Display', 'Libre Franklin'],
      ['Cormorant', 'Mulish'],
    ],
    motifs: 'Specimen-plate framing, fine engraved line borders, Latin captions, numbered figures.',
    imagery: 'Herbarium-style specimens on flat ground, engraved illustration, soft north light.',
    forbid: 'Cream ground; terracotta accent (cream + serif + terracotta anti-pattern).',
    excludeLayouts: [],
  },
  {
    name: 'mid-century desert modern',
    mode: 'light',
    palette: 'Warm sand ground, mid teal primary, mustard accent, optional olive.',
    sample: { bg: 'hsl(38, 45%, 86%)', primary: 'hsl(178, 45%, 30%)', accent: 'hsl(44, 85%, 52%)' },
    type: 'Geometric sans display (no serif display) with a slab or bookish text face.',
    fonts: [
      ['League Spartan', 'Lora'],
      ['Jost', 'Bitter'],
      ['Outfit', 'Hepta Slab'],
    ],
    motifs: 'Arches, sun discs, stacked stripes, rounded pill-free arcs, flat colour blocks.',
    imagery: 'Faded Kodachrome-warm film photography, long low shadows, flat geometric illustration.',
    forbid: 'Navy primary; serif display; gritty documentary texture.',
    excludeLayouts: [],
  },
  {
    name: 'nordic daylight',
    mode: 'light',
    palette: 'Near-white daylight ground, mid fjord-teal primary, one lingonberry accent.',
    sample: { bg: 'hsl(200, 20%, 97%)', primary: 'hsl(190, 45%, 32%)', accent: 'hsl(350, 70%, 45%)' },
    type: 'Soft humanist sans with a calm text serif.',
    fonts: [
      ['Nunito Sans', 'Spectral'],
      ['Red Hat Display', 'Red Hat Text'],
      ['Onest', 'Literata'],
    ],
    motifs: '12-16px radii, airy spacing, birch-pale surfaces, thin soft dividers.',
    imagery: 'High-key natural-light photography, pale wood, open sky, no grit.',
    forbid: 'Dark sections dominating the page; heavy grotesque display.',
    excludeLayouts: [],
  },
  {
    name: 'oxblood & brass luxe',
    mode: 'dark',
    palette: 'Oxblood-black ground, oxblood primary, brass or champagne accent, ivory text.',
    sample: { bg: 'hsl(350, 35%, 9%)', primary: 'hsl(350, 55%, 32%)', accent: 'hsl(42, 55%, 58%)' },
    type: 'High-contrast didone with a refined narrow or humanist sans.',
    fonts: [
      ['Bodoni Moda', 'Tenor Sans'],
      ['DM Serif Display', 'DM Sans'],
      ['Prata', 'Gantari'],
    ],
    motifs: 'Thin brass rules, monogram marks, letterspaced small caps, deep vignettes.',
    imagery: 'Low-key studio product photography, chiaroscuro, polished metal and leather.',
    forbid: 'Glow effects, rounded-full pills, multi-layer shadows (dark + glow anti-pattern); purple.',
    excludeLayouts: [],
  },
  {
    name: 'cyanotype blueprint',
    mode: 'dark',
    palette: 'Prussian-blue ground, white and pale-blue line work, one rust accent.',
    sample: { bg: 'hsl(212, 70%, 22%)', primary: 'hsl(205, 40%, 94%)', accent: 'hsl(18, 75%, 48%)' },
    type: 'Drafting mono or stencil display with a semi-condensed sans.',
    fonts: [
      ['Sometype Mono', 'Barlow Semi Condensed'],
      ['Major Mono Display', 'Atkinson Hyperlegible'],
      ['Spline Sans Mono', 'Saira'],
    ],
    motifs: 'White line diagrams, dimension arrows, grid-paper tint, callout leaders.',
    imagery: 'Cyanotype photograms and blue-toned duotones; technical drawings over photos.',
    forbid: 'Glow or neon; pairing with terminal / data-readout (drifts into dark-mode console).',
    excludeLayouts: ['terminal / data-readout'],
  },
  {
    name: 'candy pop maximal',
    mode: 'light',
    palette: 'Lemon or bubblegum ground, tomato-red primary, cobalt accent; flat saturated blocks.',
    sample: { bg: 'hsl(52, 100%, 78%)', primary: 'hsl(6, 85%, 52%)', accent: 'hsl(222, 85%, 50%)' },
    type: 'Fat rounded or swash display with a friendly geometric sans.',
    fonts: [
      ['Bagel Fat One', 'Nunito'],
      ['Shrikhand', 'Gabarito'],
      ['Titan One', 'Lexend'],
    ],
    motifs: 'Sticker shapes, thick dark outlines, offset solid shadows, wobbly blobs.',
    imagery: 'Cut-out product shots on flat colour, bright studio light, playful props.',
    forbid: 'Gradients; muted or desaturated palette; navy anywhere.',
    excludeLayouts: [],
  },
  {
    name: 'noir monochrome film',
    mode: 'dark',
    palette: 'Near-black ground, bone-white type, at most one red used in two places or fewer.',
    sample: { bg: 'hsl(0, 0%, 5%)', primary: 'hsl(40, 10%, 94%)', accent: 'hsl(2, 85%, 50%)' },
    type: 'Tall condensed display with a classical text serif.',
    fonts: [
      ['Bebas Neue', 'Crimson Pro'],
      ['Anton', 'EB Garamond'],
      ['Six Caps', 'Libre Caslon Text'],
    ],
    motifs: 'Film grain, letterbox bars, hard cuts, title-card typography.',
    imagery: 'High-contrast black-and-white photography, deep shadows, single hard light.',
    forbid: 'Glow; colour photography; pairing with terminal / data-readout.',
    excludeLayouts: ['terminal / data-readout'],
  },
  {
    name: 'tropical vivid',
    mode: 'dark',
    palette: 'Deep jungle-green ground, hibiscus-pink primary, mango accent.',
    sample: { bg: 'hsl(155, 55%, 14%)', primary: 'hsl(340, 85%, 60%)', accent: 'hsl(40, 95%, 58%)' },
    type: 'Fat-face or high-contrast display serif with a clean modern sans.',
    fonts: [
      ['Abril Fatface', 'Figtree'],
      ['Yeseva One', 'Sora'],
      ['Rozha One', 'Urbanist'],
    ],
    motifs: 'Leaf-cut masks, organic blob shapes, layered foliage edges.',
    imagery: 'Lush saturated photography, humid light, dense greenery and fruit colour.',
    forbid: 'Grey grounds; desaturated grading.',
    excludeLayouts: [],
  },
  {
    name: 'acid tech on paper',
    mode: 'light',
    palette: 'Off-white paper ground, acid lime as a large surface colour, black ink.',
    sample: { bg: 'hsl(60, 20%, 95%)', primary: 'hsl(75, 95%, 55%)', accent: 'hsl(0, 0%, 7%)' },
    type: 'Wide or variable display grotesque with a crisp mono.',
    fonts: [
      ['Unbounded', 'Fragment Mono'],
      ['Funnel Display', 'Funnel Sans'],
      ['Krona One', 'Geologica'],
    ],
    motifs: 'Lime blocks and bars, dithered or pixel edges, sharp geometry, oversized index numbers.',
    imagery: 'Dithered or duotone-lime imagery, product renders on paper white.',
    forbid: 'Lime used as a glow; dark mode.',
    excludeLayouts: [],
  },
  {
    name: 'folk pattern craft',
    mode: 'mid',
    palette: 'Madder-red ground, cream primary, marigold and indigo accents.',
    sample: { bg: 'hsl(8, 62%, 40%)', primary: 'hsl(40, 45%, 92%)', accent: 'hsl(42, 90%, 55%)' },
    type: 'Wood-type slab display with a sturdy humanist text face.',
    fonts: [
      ['Alfa Slab One', 'Lato'],
      ['Zilla Slab', 'Cabin'],
      ['Arvo', 'PT Sans'],
    ],
    motifs: 'Repeating pattern borders drawn in CSS/SVG, stamped texture, symmetric ornaments.',
    imagery: 'Warm handmade-object photography, textiles and tools, woodcut-style illustration.',
    forbid: 'Grey grounds; sterile minimalism.',
    excludeLayouts: [],
  },
  {
    name: 'mineral pastel',
    mode: 'light',
    palette: 'Chalky mint or blush ground, plum-ink primary, coral accent.',
    sample: { bg: 'hsl(150, 35%, 90%)', primary: 'hsl(320, 30%, 22%)', accent: 'hsl(12, 80%, 62%)' },
    type: 'Soft contemporary serif with a clean grotesque text face.',
    fonts: [
      ['Instrument Serif', 'Instrument Sans'],
      ['Young Serif', 'Wix Madefor Text'],
      ['Petrona', 'Golos Text'],
    ],
    motifs: 'Speckle and terrazzo texture, soft ceramic surfaces, rounded slabs.',
    imagery: 'Soft-light still life, stone and ceramic, pastel backdrops.',
    forbid: 'Lavender or indigo (purple anti-pattern); gradients.',
    excludeLayouts: [],
  },
];

export const STYLE_FAMILIES = STYLE_FAMILY_SPECS.map((f) => f.name);
export const STYLE_FAMILY_SET = new Set(STYLE_FAMILIES);
export const STYLE_FAMILY_BY_NAME = Object.fromEntries(STYLE_FAMILY_SPECS.map((f) => [f.name, f]));

/** Palette base the family's sample fingerprints to, e.g. "light|ink-blue". */
export const expectedBase = (name) => {
  const spec = STYLE_FAMILY_BY_NAME[name];
  return spec ? fingerprintColors(spec.sample)?.base : null;
};

/**
 * Hand-checked style family of sites shipped before meta.styleFamily existed.
 * Overrides classifyStyleFamily() for these slugs. Lives here rather than in
 * their meta.json because the visual-review digest hashes meta.json: editing it
 * would stale every review. Add a slug here to correct a misclassification.
 */
export const LEGACY_STYLE_FAMILY = {
  megabivvy: 'industrial safety-signage',
  defilade: 'industrial safety-signage',
  'drogue-and-crate': 'industrial safety-signage',
  'the-road-roller-press': 'industrial safety-signage',
  'imperivm-spqr': 'oxblood & brass luxe',
  grainfold: 'industrial safety-signage',
  'marrow-and-manifold': 'industrial safety-signage',
  'the-sub-oolite-salt-cellar': 'industrial safety-signage',
  'trace-and-tungsten': 'industrial safety-signage',
  tracemend: 'industrial safety-signage',
  'ash-07-studio': 'industrial safety-signage',
  'forge-and-fallow': 'industrial safety-signage',
};

const SAMPLES = STYLE_FAMILY_SPECS.map((f) => ({
  name: f.name,
  bg: toOklab(parseColor(f.sample.bg)),
  primary: toOklab(parseColor(f.sample.primary)),
  accent: toOklab(parseColor(f.sample.accent)),
}));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Nearest style family for a site that predates the families, from its :root palette.
 * The house look (light grey ground + navy ink) is matched by rule, because a
 * nearest-colour match scatters it across several families; everything else goes
 * to the family whose reference palette is closest in OKLab, the ground weighted
 * most. Approximate by nature -- these sites were not built to a family -- but it
 * keeps sites that look alike in the same group, which is what the hub order needs.
 * @returns {string | null} null when the palette cannot be read
 */
export function classifyStyleFamily(vars) {
  const fp = paletteFingerprint(vars);
  if (!fp) return null;
  if (fp.base === ATTRACTOR_BASE) return ATTRACTOR_FAMILY;
  const { bg, primary, accent } = paletteColors(vars);
  const [B, P, A] = [bg, primary, accent].map((c) => (c ? toOklab(c) : null));
  let best = null;
  let bestScore = Infinity;
  for (const s of SAMPLES) {
    const score = 2 * dist(B, s.bg) + 1.5 * dist(P, s.primary) + (A ? dist(A, s.accent) : 0.3);
    if (score < bestScore) {
      bestScore = score;
      best = s.name;
    }
  }
  return best;
}

/**
 * The one place a site's style family is decided: meta.styleFamily, else the
 * hand-checked legacy map, else the palette classifier.
 * @returns {{ family: string | null, source: 'meta' | 'legacy' | 'classified' | null }}
 */
export function resolveStyleFamily(slug, meta, vars) {
  if (STYLE_FAMILY_SET.has(meta?.styleFamily)) return { family: meta.styleFamily, source: 'meta' };
  if (LEGACY_STYLE_FAMILY[slug]) return { family: LEGACY_STYLE_FAMILY[slug], source: 'legacy' };
  const family = classifyStyleFamily(vars);
  return { family, source: family ? 'classified' : null };
}
