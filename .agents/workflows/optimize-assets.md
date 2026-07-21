---
description: Convert site images to WebP and optimize HTML image attributes for a slug or the whole repo
---

# /optimize-assets

Optional recovery / polish pass for image pipelines.

## Steps

1. If the user names a slug, focus on `sites/<slug>/assets/` and that site’s HTML/CSS/JS refs; otherwise run repo-wide.
2. From repo root:
   - `npm run optimize:webp`
   - `npm run optimize:html`
3. Verify `meta.json` `"hero"` still matches the final WebP filename.
4. Spot-check that no HTML still points at deleted `.webp` / `.webp` files.
5. Optionally run `/qa-sweep` afterward.
6. Do not commit unless asked.
