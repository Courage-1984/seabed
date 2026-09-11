---
trigger: model_decision
description: Frontend visual craft rules when building or editing a site under sites/ — layout, hero, typography, motion, anti-patterns
---

# Frontend design (new sites)

Apply when creating or substantially editing HTML/CSS/JS under `sites/`.

## First viewport

- One composition — not a dashboard of widgets.
- Brand (product/name) is a **hero-level** signal, not only nav text.
- Brand test: if you remove the nav and the first viewport could belong to another brand, branding is too weak.
- Hero budget: brand + one headline + one short supporting sentence + one CTA group + one dominant full-bleed image/plane.
- No detached labels, floating badges, promo stickers, or chips on top of hero media.
- No stats strips, schedules, address blocks, or secondary marketing in the first viewport.

## Typography and atmosphere

- Expressive, purposeful font pairs (e.g. Google Fonts). Do **not** use Inter, Roboto, Arial, or system-ui as the primary display face for new sites.
- Do not rely on flat single-color backgrounds — use gradients, imagery, or subtle patterns.
- Define a clear palette via CSS variables on `:root` (e.g., `--color-bg-base`, `--color-text-main`, `--color-accent`). Consider using HSL or exact hex codes for precision.
- Define interactive states standardly (e.g., `--color-hover`, `--color-focus`).

## Sections and cards

- One job per section: one purpose, one headline, usually one short supporting sentence.
- Default: no cards. Cards only when they contain a real user interaction. Never cards in the hero.
- Imagery should show product, place, atmosphere, or context — decorative blobs alone are not the main idea.

## Layout signature (brief-driven)

- Implement the brief’s **mandatory structural signature** for the named layout family — not a generic two-column page dressed with the family name.
- **Hard cap:** at most one literal left-image/right-text (or mirrored) split section site-wide; never in the hero. `sticky-rail + content` is the one family where a two-pane sticky region is correct (one region, with a real sticky mechanic).
- Repeating image/text split stacks across sections = failed layout; rebuild before QA.

## Motion

Every site ships a real motion system. The full **motion budget** is canonical in `AGENTS.md` §13 — do not restate it here. In short: one IntersectionObserver scroll-reveal system, the rolled signature effect, the layout family's signature motion, 2–3 supporting motions, 2 micro-interactions, transform/opacity only, 120–400ms with a custom cubic-bezier, and a `prefers-reduced-motion` block that neutralises all of it.

Signature-effect pool and per-effect specs: `scripts/lib/signature-effects.js`.

## Video Integration

Every site ships exactly one video, generated for that site alone. Placement is **seeded from the brief and constrained by the layout family** — never derived from the day of the month.

- Canonical rule: `AGENTS.md` §11.
- Slot registry, per-slot implementation specs, and the layout→slot compatibility map: `scripts/lib/video-placements.js`.
- The site must look and work perfectly with no video present; the video layers into a slot that already works.
- Text over a video always needs an engineered scrim. This is the single most common legibility failure in this repo.

## Anti-patterns (avoid unless the brief explicitly demands them)

- Purple-on-white or purple-to-indigo gradient themes
- Warm cream background (~#F4F1EA) + high-contrast serif + terracotta accent
- Broadsheet / dense newspaper columns with hairline rules and zero radius
- Default dark mode + glow effects + rounded-full pills + multi-layer shadows + emoji decoration

## Responsive

- Must work on desktop and mobile; no horizontal overflow (QA checks this).
- Prefer `overflow-x: hidden` on `html`/`body` only as a safety net, not a substitute for fixing layout bugs.
