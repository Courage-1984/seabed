/**
 * Canonical signature-effect pool for meta.signatureEffect.
 *
 * Every site implements exactly one signature effect on top of its mandatory
 * motion budget (see AGENTS.md "Motion budget"). Rolled by scripts/lib/rotation.js:
 * not among the last EFFECT_BAN_WINDOW sites, otherwise a weighted random pick
 * that favours the effects used longest ago.
 */
import { pickRotated, mulberry32 } from './weighted-pick.js';

/**
 * 9 of 12, not 12 of 12. Banning the whole pool left nothing eligible on almost
 * every roll, so the engine fell back to a fixed round-robin with no randomness.
 */
export const EFFECT_BAN_WINDOW = 9;

export const SIGNATURE_EFFECTS = [
  'scroll-driven clip-path wipe',
  'text scramble decode on reveal',
  'magnetic proximity cursor element',
  'sticky section pinning with cross-fade',
  'animated SVG line-draw',
  'scroll-velocity marquee skew',
  'drifting grain overlay',
  'numeric counter roll-up',
  'CSS 3D card tilt',
  'masked scroll-through type',
  'staggered letter-by-letter headline',
  'progressive blur focus-pull',
];

export const SIGNATURE_EFFECT_SET = new Set(SIGNATURE_EFFECTS);

/** What "implemented for real" means for each effect. A name alone is not a spec. */
export const SIGNATURE_EFFECT_SPECS = {
  'scroll-driven clip-path wipe':
    'A section is revealed by animating clip-path (inset/polygon) against scroll progress, not by a plain opacity fade.',
  'text scramble decode on reveal':
    'Headline characters cycle through a glyph set and settle into the final string once, on first intersection.',
  'magnetic proximity cursor element':
    'A CTA or mark translates toward the pointer within a radius, easing back on leave. Pointer-fine only.',
  'sticky section pinning with cross-fade':
    'One section pins for a scroll distance while its inner panels cross-fade or swap through at least three states.',
  'animated SVG line-draw': 'An inline SVG path draws itself via stroke-dasharray/stroke-dashoffset on intersection.',
  'scroll-velocity marquee skew':
    'A marquee or band skews and changes speed in proportion to scroll velocity, settling when scrolling stops.',
  'drifting grain overlay':
    'A CSS/SVG noise layer drifts slowly over the page at low opacity, with blend mode, never above interactive content.',
  'numeric counter roll-up':
    'Real numbers in the copy count up from zero on intersection, once, with tabular-nums so the layout does not jitter.',
  'CSS 3D card tilt':
    'Cards tilt in 3D toward the pointer with perspective and a specular highlight. Pointer-fine only.',
  'masked scroll-through type':
    'Oversized type acts as a mask through which imagery or colour scrolls at a different rate.',
  'staggered letter-by-letter headline':
    'The hero headline animates in per-character or per-word with a stagger, preserving a readable no-JS fallback.',
  'progressive blur focus-pull':
    'Elements resolve from blurred to sharp as they enter the viewport, driven by scroll position.',
};

/**
 * Deterministic effect resolution. `recent` is newest-first. Kept for callers of
 * the old API; scripts/lib/rotation.js is the engine.
 */
export function resolveSignatureEffect(seed, recent = []) {
  return pickRotated(SIGNATURE_EFFECTS, recent, { ban: EFFECT_BAN_WINDOW, rng: mulberry32(seed) }).value;
}
