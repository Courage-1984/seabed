---
name: scaffold-site
description: Creates a new flat v2 site folder under sites/<slug>/ with meta.json, index.html, style.css, main.js, and assets/. Use after parse-brief when adding a daily website, scaffolding a new brand site, or starting the build pipeline.
---

# Scaffold site

## Goal

Create the empty v2 tree for a new site without nested Vite apps.

## Preconditions

- Checklist from `parse-brief` (brand, slug, blurb).
- Confirm `sites/<slug>/` does not exist. If it does: ask whether to **upgrade in place** or choose a new slug — do not overwrite silently.

## Create

```
sites/<slug>/
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
  "standard": "v2"
}
```

Omit `"qa": "v2-pass"` until @.agents/skills/qa-and-ship/SKILL.md gate passes.

### index.html (stub)

Minimal valid document: `lang` default `en-GB` (see @GEMINI.md Defaults), charset, viewport, title, description, favicon link to `./assets/favicon.svg`, stylesheet `./style.css`, script `./main.js` (defer), empty `<main>`.

### style.css / main.js

Empty or minimal reset placeholders — `design-and-build` fills them in.

### assets/

Empty directory. Add `favicon.svg` during design or image pass (required before QA).

## Do not

- Run `npm create vite` inside the site folder.
- Add per-site `package.json`.
- Touch other sites or `hub.js`.

## Next

Hand off to `design-and-build`.
