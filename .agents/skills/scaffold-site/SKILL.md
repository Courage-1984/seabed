---
name: scaffold-site
description: Creates a new flat v2 site folder under sites/<YYYY-MM>/<slug>/ with meta.json, index.html, style.css, main.js, and assets/ within its corresponding chronological bucket. Use after parse-brief when adding a daily website, scaffolding a new brand site, or starting the build pipeline.
---

# Scaffold site

## Goal

Create the empty v2 tree for a new site without nested Vite apps, placing it inside a chronological Year-Month bucket (`sites/YYYY-MM/<slug>/`) based on today's UTC date or the brief's date.

## Preconditions

- Checklist from `parse-brief` (brand, slug, blurb, date).
- Determine bucket folder: extract `YYYY-MM` from today's UTC date (or brief date).
- Confirm `sites/<YYYY-MM>/<slug>/` (or any existing folder across `./sites/` matching `<slug>`) does not already exist. If it does: ask whether to **upgrade in place** or choose a new slug — do not overwrite silently.

## Create

```
sites/<YYYY-MM>/<slug>/
  meta.json
  index.html
  style.css
  main.js
  assets/
```

### meta.json (stub)

```json
{
  "title": "<Brand Name>",
  "blurb": "<One-line blurb from brief>",
  "hero": "assets/hero.webp",
  "layoutFamily": "<exact layout family from brief §3>",
  "tags": ["<tag1>", "<tag2>"],
  "created": "<YYYY-MM-DD UTC today>",
  "standard": "v2"
}
```

Omit `"qa": "v2-pass"` until @.agents/skills/qa-and-ship/SKILL.md gate passes. `layoutFamily` must be one of the **eleven** names in @.agents/rules/01-site-v2-standard.md / `scripts/lib/layout-families.js`. Set `"created"` to today’s UTC date (`YYYY-MM-DD`). Generate 1-3 semantic tags categorizing the site (e.g. `ecommerce`, `industrial`, `medical`). When the brief §3 word floor is known, you may add `"wordFloor": <n>` now or at ship.

### index.html (stub)

Minimal valid document: `lang` default `en-GB` (see @GEMINI.md Defaults), charset, viewport, title, description, favicon link to `./assets/favicon.svg`, stylesheet `./style.css`, script `./main.js` (defer), empty `<main>`.

### style.css / main.js

- `style.css`: empty or minimal reset placeholders — `design-and-build` fills them in.
- `main.js` **must** start with:

```js
import './style.css';
```

### assets/

Empty directory. Add `favicon.svg` during design or image pass (required before QA).

## Do not

- Run `npm create vite` inside the site folder.
- Add per-site `package.json`.
- Touch other sites or `hub.js`.

## Next

Hand off to `design-and-build`. Note: all CLI scripts (e.g. `npm run optimize:webp -- --slug <slug>`, `npm run qa -- <slug>`, `check:ship`) accept the bare `<slug>` without typing the month prefix!
