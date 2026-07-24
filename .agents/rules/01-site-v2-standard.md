---
trigger: glob
glob: sites/**
description: Site v2 folder layout, meta.json schema, and asset path contract for hub sites
---

# Site v2 standard

Every new or upgraded site must follow this layout:

```
sites/<kebab-slug>/
  meta.json
  index.html
  style.css
  main.js
  [optional extra pages: about.html, contact.html, ...]
  assets/
    favicon.svg
    *.webp
```

## meta.json schema

```json
{
  "title": "Brand Name",
  "blurb": "One-line hub card description.",
  "hero": "assets/hero.webp",
  "layoutFamily": "bento",
  "tags": ["ecommerce", "apparel"],
  "created": "2026-07-21",
  "wordFloor": 1100,
  "standard": "v2",
  "qa": "v2-pass"
}
```

- `title`, `blurb`, `hero` are required for hub cards.
- `hero` is relative to the site folder, **without** a leading `./` (e.g. `assets/tig_arc.webp`).
- `layoutFamily` — one of the eleven names (exact): `asymmetric split`, `editorial magazine`, `bento`, `brutalist stacked`, `horizontal-scroll band`, `ultra-minimal full-bleed`, `sticky-rail + content`, `diagonal-cut`, `overlapping card-stack`, `terminal / data-readout`, `kinetic ticker / marquee bands`. Required at ship so `npm run sites:index` can feed Gemini collision avoidance. Canonical list: `scripts/lib/layout-families.js`.
- `tags` — required array of 1-3 semantic tags categorizing the site (e.g., `saas`, `medical`, `industrial`, `ecommerce`, `fintech`, `lifestyle`). These are rendered as filter chips on the hub archive.
- `created` — required `YYYY-MM-DD` (UTC day the site was built/shipped). Hub sorts newest-first by this field. Set at scaffold; confirm at ship.
- `wordFloor` (optional number) — brief §3 word floor; used by `check:copy-depth` / `check:ship` when CLI floor is omitted. Set at ship when known; do not invent for legacy sites.
- Set `"standard": "v2"` when the folder matches this layout.
- Set `"qa": "v2-pass"` only per the gate in @.agents/skills/qa-and-ship/SKILL.md.
- Validate statically with `npm run check:contract -- <slug|--all>`.

## Paths

- In HTML/CSS/JS: use relative paths like `./assets/...`, `./style.css`, `./main.js`.
- Never use absolute site roots like `/assets/` (breaks GitHub Pages under a project path).
- Favicon: `<link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">`.

## Forbidden in site folders

- Nested `package.json`, `package-lock.json`, or Vite/React scaffolds
- `src/`, `public/` leftover from create-vite
- Per-site `node_modules/`
- Unoptimized large PNG/JPEG left as the only hero (convert to WebP)

## Hub integration

Adding `sites/<slug>/meta.json` is enough for discovery — do not edit `hub.js` / `hub.css` / `index.html` when **adding a site**. Hub UX (discovery strip, featured drop, archive) lives in those root files; redesign them only when intentionally changing the hub, not as part of a daily site build. The archive surfaces `layoutFamily` as filter chips and card tags (plus a Recent window relative to the newest site’s `created` date).
