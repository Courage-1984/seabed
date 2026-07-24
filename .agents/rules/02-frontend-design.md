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
- Define a clear palette via CSS variables on `:root`.

## Sections and cards

- One job per section: one purpose, one headline, usually one short supporting sentence.
- Default: no cards. Cards only when they contain a real user interaction. Never cards in the hero.
- Imagery should show product, place, atmosphere, or context — decorative blobs alone are not the main idea.

## Layout signature (brief-driven)

- Implement the brief’s **mandatory structural signature** for the named layout family — not a generic two-column page dressed with the family name.
- **Hard cap:** at most one literal left-image/right-text (or mirrored) split section site-wide; never in the hero. `sticky-rail + content` is the one family where a two-pane sticky region is correct (one region, with a real sticky mechanic).
- Repeating image/text split stacks across sections = failed layout; rebuild before QA.

## Motion

- Ship at least 2–3 intentional motions (scroll reveal, hover, ambient, etc.) that create hierarchy — not noise.

## Anti-patterns (avoid unless the brief explicitly demands them)

- Purple-on-white or purple-to-indigo gradient themes
- Warm cream background (~#F4F1EA) + high-contrast serif + terracotta accent
- Broadsheet / dense newspaper columns with hairline rules and zero radius
- Default dark mode + glow effects + rounded-full pills + multi-layer shadows + emoji decoration

## Responsive

- Must work on desktop and mobile; no horizontal overflow (QA checks this).
- Prefer `overflow-x: hidden` on `html`/`body` only as a safety net, not a substitute for fixing layout bugs.
