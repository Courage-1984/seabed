/**
 * Canonical video placement slots for meta.videoPlacement.
 *
 * Every site ships exactly ONE video. Which slot it occupies is rolled from the
 * brief seed and constrained by the site's layout family, so the same placement
 * never lands two builds in a row. This file is the single source of truth --
 * AGENTS.md §11 is the canonical prose; .agents/rules/02-frontend-design.md and
 * .agents/skills/design-and-build/SKILL.md point here rather than restating it.
 *
 * Selection (see AGENTS.md §11):
 *   slotIndex = (seed + 5) % 12
 *   advance slotIndex by +1 until the slot is BOTH
 *     (a) listed in PLACEMENT_BY_FAMILY[layoutFamily], and
 *     (b) not among the last 8 sites' videoPlacement values
 */
export const VIDEO_PLACEMENTS = [
  'hero background',
  'hero inset frame',
  'inline process demo',
  'sticky rail loop',
  'split panel',
  'footer ambient',
  'hover reveal',
  'section transition band',
  'masked type fill',
  'grid tile',
  'marquee strip',
  'modal feature',
];

export const VIDEO_PLACEMENT_SET = new Set(VIDEO_PLACEMENTS);

/** One-line implementation requirement per slot. A name alone is not a spec. */
export const VIDEO_PLACEMENT_SPECS = {
  'hero background':
    'Full-bleed loop behind the hero type. Requires an engineered scrim (gradient or colour wash) so headline contrast stays >= 4.5:1 over the brightest frame.',
  'hero inset frame':
    'Contained video panel sitting beside or beneath the hero headline, framed as a deliberate object (border, offset shadow, or clipped shape) -- not a background.',
  'inline process demo':
    'Standalone player anchored in a mid-page content section, captioned, showing the process/product the copy is describing at that point.',
  'sticky rail loop':
    'Video pinned in a sticky rail or fixed side column that stays put while adjacent content scrolls past it.',
  'split panel':
    'Video occupies one half of a full-viewport split; the other half scrolls independently. The video half must be pinned for the duration of the section.',
  'footer ambient':
    'Ambient motion backdrop behind the closing CTA or footer, heavily scrimmed and low-contrast so footer links stay legible.',
  'hover reveal':
    'A prominent poster/still element swaps to the playing video on hover and on :focus-visible. Must degrade to the poster on touch devices.',
  'section transition band':
    'Video fills a short full-width interstitial band between two content sections, revealed by a scroll-triggered clip or wipe.',
  'masked type fill':
    'Video is visible only through a text or shape mask (background-clip: text or an SVG/CSS mask). Requires a solid fallback colour where masking is unsupported.',
  'grid tile':
    'The video occupies exactly one cell of the page grid/bento, sized and gapped identically to its neighbouring tiles.',
  'marquee strip': 'Video sits inside a horizontal band or repeating strip that drifts with scroll velocity.',
  'modal feature':
    'A poster tile opens the video in a focused overlay. Must be keyboard-operable, focus-trapped, and dismissible with Escape.',
};

/**
 * layoutFamily -> placement slots that suit it structurally.
 * Every family has at least four options so the last-8 ban can always resolve.
 */
export const PLACEMENT_BY_FAMILY = {
  'asymmetric split': [
    'hero inset frame',
    'split panel',
    'inline process demo',
    'hover reveal',
    'section transition band',
    'footer ambient',
  ],
  'editorial magazine': [
    'hero inset frame',
    'inline process demo',
    'grid tile',
    'modal feature',
    'masked type fill',
    'footer ambient',
  ],
  bento: ['grid tile', 'hover reveal', 'hero inset frame', 'modal feature', 'inline process demo'],
  'brutalist stacked': [
    'hero background',
    'section transition band',
    'marquee strip',
    'masked type fill',
    'footer ambient',
    'inline process demo',
  ],
  'horizontal-scroll band': [
    'marquee strip',
    'grid tile',
    'hover reveal',
    'inline process demo',
    'section transition band',
  ],
  'ultra-minimal full-bleed': [
    'hero background',
    'masked type fill',
    'footer ambient',
    'section transition band',
    'modal feature',
  ],
  'sticky-rail + content': [
    'sticky rail loop',
    'split panel',
    'hero inset frame',
    'inline process demo',
    'footer ambient',
  ],
  'diagonal-cut': [
    'section transition band',
    'hero background',
    'split panel',
    'masked type fill',
    'inline process demo',
    'footer ambient',
  ],
  'overlapping card-stack': ['grid tile', 'hover reveal', 'modal feature', 'hero inset frame', 'inline process demo'],
  'terminal / data-readout': [
    'inline process demo',
    'grid tile',
    'hover reveal',
    'modal feature',
    'footer ambient',
    'sticky rail loop',
  ],
  'kinetic ticker / marquee bands': [
    'marquee strip',
    'section transition band',
    'hero background',
    'masked type fill',
    'footer ambient',
  ],
  'layered-parallax': [
    'hero background',
    'section transition band',
    'footer ambient',
    'masked type fill',
    'split panel',
  ],
  'split-screen scroll': [
    'split panel',
    'sticky rail loop',
    'hero background',
    'section transition band',
    'inline process demo',
  ],
  'neo-brutalist masonry': ['grid tile', 'hover reveal', 'marquee strip', 'modal feature', 'inline process demo'],
  'cinematic full-bleed canvas': [
    'hero background',
    'section transition band',
    'masked type fill',
    'footer ambient',
    'split panel',
  ],
  'index / ledger': [
    'inline process demo',
    'hover reveal',
    'modal feature',
    'sticky rail loop',
    'grid tile',
    'footer ambient',
  ],
  'modular grid-break collage': [
    'grid tile',
    'hover reveal',
    'hero inset frame',
    'marquee strip',
    'modal feature',
    'section transition band',
  ],
};

/** kebab-case token used in asset filenames, e.g. "sticky rail loop" -> "sticky-rail-loop". */
export function placementSlug(placement) {
  return String(placement)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Deterministic slot resolution. `recent` is the videoPlacement values of the
 * most recent sites, newest first; the last 8 are banned.
 */
export function resolvePlacement(seed, layoutFamily, recent = []) {
  const allowed = PLACEMENT_BY_FAMILY[layoutFamily];
  if (!allowed) throw new Error(`unknown layout family: ${layoutFamily}`);
  const banned = new Set(recent.slice(0, 8));
  const start = (seed + 5) % VIDEO_PLACEMENTS.length;
  for (let n = 0; n < VIDEO_PLACEMENTS.length; n++) {
    const slot = VIDEO_PLACEMENTS[(start + n) % VIDEO_PLACEMENTS.length];
    if (allowed.includes(slot) && !banned.has(slot)) return slot;
  }
  // Every compatible slot is banned -- fall back to the least-recently-used one.
  const byRecency = allowed.slice().sort((a, b) => {
    const ia = recent.indexOf(a);
    const ib = recent.indexOf(b);
    return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
  });
  return byRecency[byRecency.length - 1];
}
