---
name: design-and-build
description: Implements a full static brand website (HTML/CSS/JS) from a parsed brief under sites/<slug>/ — applies layout family, authors directed copy within ceilings, responsive 360–1440. Use when building or designing a daily site after scaffolding.
---

# Design and build

## Goal

Ship a distinctive, production-quality static site inside the scaffold. Follow @.agents/rules/02-frontend-design.md and @.agents/rules/01-site-v2-standard.md. Use research notes from `research-and-plan`.

## Structure and layout

1. Implement the **architecture** from the brief (§3): page files and section list — do not invent extra pages.
2. Implement the named **layout family** from §3/§6 — **name alone is not enough**. Apply the brief’s **mandatory structural signature** and avoid the **forbidden pattern**. Allowed family names (exact):
   - `asymmetric split`, `editorial magazine`, `bento`, `brutalist stacked`, `horizontal-scroll band`, `ultra-minimal full-bleed`, `sticky-rail + content`, `diagonal-cut`, `overlapping card-stack`, `terminal / data-readout`, `kinetic ticker / marquee bands`
3. Write `"layoutFamily"` (exact name) into `meta.json`. When brief §3 word floor is known, set `"wordFloor"` as well.
4. **L/R split hard cap:** at most **one** section site-wide may use a literal left-image/right-text (or mirrored) split. The hero is **never** that section. If the family is `sticky-rail + content`, that two-pane sticky mechanic is the allowed exception (one page region, not every section). If the build collapses into repeating image-left/text-right across sections, **rebuild** those sections before QA — that is a failed layout regardless of the family name declared.
5. Multi-page: copy shared nav/footer into each HTML file; each page keeps a distinct purpose.
6. `main.js` **must** begin with `import './style.css';` (Vite entry). Keep `<link rel="stylesheet" href="./style.css">` in HTML as well if the brief/scaffold uses it — both are fine; the import is required.

## Copy (split load)

1. Use §4a **verbatim** exactly (hero + one flagship) — no paraphrasing.
2. **Author all §4b directed sections** yourself in the brand voice card / tone.
3. Respect density:
   - Body sections: 120–180 words (do not exceed ceiling; do not pad).
   - FAQ answers: 40–80 words; testimonials: 30–50 words + attribution.
   - Stay within site word floor/ceiling from §3.
4. Apply brief §4c copy rules (anti-AI-tells, British English, no placeholders).

## Pre-handoff self-check (mandatory)

Before `acquire-images`:

1. **Word counts:** Every §4b section meets its min/max; site total within §3 floor/ceiling.
2. **Section count:** Minimum directed (§4b) sections for the architecture:
   - **Landing:** ≥ 5 directed sections (plus §4a hero + flagship).
   - **Dense one-pager:** ≥ 7 directed sections.
   - **Multi-page:** ≥ 4 directed sections per non-index page; pages must not clone each other.
3. **Layout signature:** Structural signature from §6 is visibly present; L/R hard cap respected.
4. Run `node scripts/check-copy-depth.js <slug> <floor>` using §3 word floor — must pass before QA.

## Requirements

1. **Semantic HTML** — landmarks, heading hierarchy, button/link semantics.
2. **Meta** — title, description, OG tags, `lang`, viewport.
3. **Brand-first hero** — per @.agents/rules/02-frontend-design.md (hero budget, first viewport).
4. **CSS** — `:root` colour variables from §5; fluid type/spacing; breakpoints for 360–1440; **no horizontal overflow**.
5. **Fonts** — §6 pairing only; banned display faces per @.agents/rules/02-frontend-design.md.
6. **Motion** — implement the 2–3 ideas from §6.
7. **Favicon** — custom `assets/favicon.svg`.
8. **Distinctiveness** — do not clone another site in this repo.
9. Reference `./assets/<name>.webp` paths; @.agents/skills/acquire-images/SKILL.md must resolve them before QA.

## Responsive mindset

- No fixed widths that blow out mobile; prefer `max-width`, flex/grid, `clamp()` for type where helpful.
- Images: `max-width: 100%; height: auto`.
- Test mentally at ~390 and ~1280; `qa-and-ship` confirms.

## Next

Hand off to `acquire-images`, then optimize scripts, then `qa-and-ship`.
