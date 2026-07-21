---
description: Flatten a legacy nested Vite site folder into the flat v2 static layout under sites/
---

# /upgrade-site-v2

Use when a site under `sites/<slug>/` still has a nested Vite scaffold (`package.json`, `src/`, `public/`) or non-v2 layout.

## Steps

1. Identify the target slug (user argument or ask once).
2. Inventory current HTML/CSS/JS/assets worth keeping.
3. Restructure to flat v2:

```
sites/<slug>/
  meta.json
  index.html
  style.css
  main.js
  assets/
    favicon.svg
    *.webp
```

4. Move assets out of `src/assets` / `public` into `assets/`; fix relative paths.
5. Delete nested `package.json`, `package-lock.json`, `src/`, Vite leftovers, and per-site `.gitignore` if it only existed for the scaffold.
6. Write/update `meta.json` with `title`, `blurb`, `hero`, `"standard": "v2"`.
7. Run `npm run optimize:webp` and `npm run optimize:html` as needed.
8. Run `/qa-sweep` (or `qa-and-ship` steps); set `"qa": "v2-pass"` only when clean.
9. Confirm the hub card resolves; do not commit unless asked.
