---
name: design-and-build
description: Implements a full static brand website (HTML/CSS/JS) from a parsed brief under sites/<slug>/ — applies layout family, authors directed copy within ceilings, responsive 360–1440. Use when building or designing a daily site after scaffolding.
---

# Design and build

## Goal

Ship a distinctive, production-quality static site inside the scaffold. Follow `.agents/rules/02-frontend-design.md` and `.agents/rules/01-site-v2-standard.md`. Use research notes from `research-and-plan`.

## Structure and layout

1. Implement the **architecture** from the brief (§3): page files and section list — do not invent extra pages.
2. Implement the named **layout family** (asymmetric split, editorial magazine, bento, brutalist stacked, horizontal-scroll band, ultra-minimal full-bleed, sticky-rail + content).
3. Multi-page: copy shared nav/footer into each HTML file; each page keeps a distinct purpose.

## Copy (split load)

1. Use §4a **verbatim** exactly (hero + one flagship) — no paraphrasing.
2. **Author all §4b directed sections** yourself in the brand voice card / tone.
3. Respect density:
   - Body sections: 120–180 words (do not exceed ceiling; do not pad).
   - FAQ answers: 40–80 words; testimonials: 30–50 words + attribution.
   - Stay within site word floor/ceiling from §3.
4. Apply §4c copy rules (British English unless overridden; no AI-tells; no placeholders).

## Requirements

1. **Semantic HTML** — landmarks, heading hierarchy, button/link semantics.
2. **Meta** — title, description, OG tags, `lang`, viewport.
3. **Brand-first hero** — full-bleed; tight hero budget (design rule).
4. **CSS** — `:root` colour variables from §5; fluid type/spacing; breakpoints for 360–1440; **no horizontal overflow**.
5. **Fonts** — §6 pairing only; never Inter/Roboto/Arial/system as primary.
6. **Motion** — implement the 2–3 ideas from §6.
7. **Favicon** — custom `assets/favicon.svg`.
8. **Distinctiveness** — do not clone another site in this repo.
9. Reference `./assets/<name>.webp` paths; `acquire-images` must resolve them before QA.

## Responsive mindset

- No fixed widths that blow out mobile; prefer `max-width`, flex/grid, `clamp()` for type where helpful.
- Images: `max-width: 100%; height: auto`.
- Test mentally at ~390 and ~1280; `qa-and-ship` confirms.

## Next

Hand off to `acquire-images`, then optimize scripts, then `qa-and-ship`.
