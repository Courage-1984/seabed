/**
 * Canonical signature-effect pool for meta.signatureEffect.
 *
 * Every site implements exactly one signature effect on top of its mandatory
 * motion budget (see AGENTS.md "Motion budget"). Rolled as
 * (seed + 11) % 12, then advanced until it is not among the last 12 sites'
 * signatureEffect values.
 */
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
 * Deterministic effect resolution. `recent` is newest-first; the last 12 are banned.
 */
export function resolveSignatureEffect(seed, recent = []) {
  const banned = new Set(recent.slice(0, 12));
  const start = (seed + 11) % SIGNATURE_EFFECTS.length;
  for (let n = 0; n < SIGNATURE_EFFECTS.length; n++) {
    const effect = SIGNATURE_EFFECTS[(start + n) % SIGNATURE_EFFECTS.length];
    if (!banned.has(effect)) return effect;
  }
  return SIGNATURE_EFFECTS[start];
}
