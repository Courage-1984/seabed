---
slug: imperivm-spqr
digest: ef2ab802cb7c554feb331142e7210e909d5226746a90cee6bca9023dabb4da5a
sheetsReviewed: 8/8
verdict: PASS
date: 2026-09-23
---

# Visual review — imperivm-spqr

First site reviewed under the enforced Extreme Visual Audit. It shipped green on
every gate while being unusable on a phone, which is what prompted the QA
overhaul; this review covers the state after the fixes.

## What the sheets showed

**`wall-…index.png`** — ten devices side by side. Before the fix the phone
columns rendered their content in a narrow left strip with a wide empty gutter,
and the full-page captures came back **2112px wide instead of 640** at
phone-320: the document was laying out 1056 CSS px on a 320px screen, driven by
two unconstrained 1024px images. `body { overflow-x: hidden }` then cropped
every section rather than showing a scrollbar, which is why it read as "off"
rather than obviously broken. After the fix every column fills its width and
phone-320 is 15554px tall, down from 21556px.

**`detail-…phone-320-01/02.png`** — read top to bottom. Headline wraps cleanly
at 320px, body copy is legible, the hero CTA and the `VIEW INCINERATED KEY
REGISTRY` link are full-width and tappable, and `CIVIC DIGNITAS: 782 / 1000
[PATRICIAN-OBSERVED CLASS]` now wraps across three lines instead of overflowing.
Both section photographs sit inside the column.

**`detail-…phone-393-01/02.png`**, **`detail-…tablet-768-01.png`**,
**`detail-…desktop-1440-01.png`** — no clipping, no overlap, no illegible type.
The two-column card grids collapse correctly at tablet and below.

**`walkthrough-imperivm-spqr.png`** — nine frames across 29.4s. Scroll is
smooth with no layout shift, the reveal animations fire once, the ticker runs,
the video modal trigger renders its poster, and navigation holds.

## Findings and fixes

| # | device | what was wrong | fix applied |
|---|---|---|---|
| 1 | all touch | two `<img>` at intrinsic 1024px, no `max-width` rule anywhere in 647 lines of CSS — 698px of overflow at 390px | added the `img/video/canvas/svg { max-width: 100%; height: auto; display: block }` reset every sibling site already had |
| 2 | phone-320/360 | `.cards-stack` `minmax(300px, 1fr)` floor exceeds a 256px content box; `auto-fit` collapses columns but never the floor | `minmax(min(300px, 100%), 1fr)` |
| 3 | all | `body { overflow-x: hidden }` converted every overflow into silent clipping | `overflow-x: clip` + `overflow-wrap: break-word` |
| 4 | phone-320 | `[PATRICIAN-OBSERVED` and a heading overflowed with no break opportunity | `overflow-wrap: break-word` on body |
| 5 | all touch | form inputs at 13.33px — iOS zooms on focus and does not zoom back | `font-size: 1rem` on `.sedition-form input, textarea` |
| 6 | all | one `max-width: 900px` query covered 5 of 15 layout blocks; padding, type scale and letter-spacing stayed at desktop values down to 320px | added a real `max-width: 600px` block (padding, type steps, `.monumental` tracking 0.1em → 0.04em, `.rations-list li` → `display: block`) |
| 7 | phone | hero scrim was `linear-gradient(to right, …)` fading to 0.2 alpha — full-bleed mobile text sat on bare photograph at the end of every line | vertical gradient under 900px |
| 8 | all touch | `.link-secondary` was a 22px line box, half the 44px minimum, and had only a `:hover` affordance | `min-height: 44px` + `:focus-visible` |
| 9 | all | `#video-modal` was a full-screen fixed overlay with `overflow-y: visible` — taller-than-viewport content unreachable | `overflow-y: auto` + padding |
| 10 | phone | `min-height: 80vh` resizes mid-scroll as the mobile URL bar collapses | added a `80dvh` fallback |
| 11 | all | signal colours failed AA on both surfaces — verdigris 2.95:1 on the light page, 3.55:1 red on the dark panels | split into `--color-*-on-light` / `--color-*-on-dark` (now 5.6:1 and 4.9:1) |
| 12 | touch | `preventDefault()` on `touchstart` cancelled scrolls starting on the full-width oath button; no `touchcancel`, so an interrupted press left it stuck in `.holding` forever | passive `touchstart`, added `touchcancel`, moved the long-press suppression to CSS |
| 13 | all | one rAF callback queued per scroll event, each forcing a sync layout read then writing `clip-path` | dedupe flag |

**Found by eye, not by any heuristic** — the reason this step exists:

| # | device | what was wrong | fix applied |
|---|---|---|---|
| 14 | phone-320 | form placeholders clipped mid-word: `NATURE OF CYBER-SEDITI(`, `SECTOR / INSULA ADDRESS` running off the field | shortened to `NATURE OF SEDITION` / `SECTOR / INSULA` |
| 15 | all | **the whole report form had no labels** — placeholder-as-label, so the name vanishes on typing and a screen reader gets nothing | `aria-label` on all four fields |

Both were then added to `visual_qa.js` as `clippedPlaceholder` and
`unlabelledField`, so the next site does not depend on someone noticing.

## Residual, not fixed

Under `prefers-reduced-motion` the site sets `.ticker-content { animation: none }`,
which leaves a 3217px decree track static inside a clipped 320px window — about
47 characters of ~500 readable, with no way to reach the rest. This is the
repo-wide marquee convention rather than anything specific to this site, so it
is recorded here rather than changed unilaterally. Worth a decision across the
`kinetic ticker / marquee bands` family.
