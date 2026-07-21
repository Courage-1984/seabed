---
trigger: always_on
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
  "standard": "v2",
  "qa": "v2-pass"
}
```

- `title`, `blurb`, `hero` are required for hub cards.
- `hero` is relative to the site folder, **without** a leading `./` (e.g. `assets/tig_arc.webp`).
- Set `"standard": "v2"` when the folder matches this layout.
- Set `"qa": "v2-pass"` only after `npm run qa` reports no critical failures for that site.

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

Adding `sites/<slug>/meta.json` is enough for discovery. Do not edit `hub.js` unless image/favicon resolution is broken.
