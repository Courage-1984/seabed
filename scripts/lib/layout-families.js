/**
 * Canonical layout-family names for meta.layoutFamily and brief §3/§6.
 * Keep in sync with .agents/rules/01-site-v2-standard.md and the
 * daily-brief-generator prompt STEP 0 table.
 */
export const LAYOUT_FAMILIES = [
  'asymmetric split',
  'editorial magazine',
  'bento',
  'brutalist stacked',
  'horizontal-scroll band',
  'ultra-minimal full-bleed',
  'sticky-rail + content',
  'diagonal-cut',
  'overlapping card-stack',
  'terminal / data-readout',
  'kinetic ticker / marquee bands',
  'layered-parallax',
  'split-screen scroll',
  'neo-brutalist masonry',
];

export const LAYOUT_FAMILY_SET = new Set(LAYOUT_FAMILIES);
