---
description: Convert site images to WebP and optimize HTML image attributes for a slug or the whole repo
---

# /optimize-assets

Optional recovery / polish pass for image pipelines.

## Steps

1. If the user names a slug, scope with `--slug`; otherwise run repo-wide.
2. From repo root:
   - `npm run optimize:webp -- --slug <slug>` (or omit `--slug` for all)
   - `npm run optimize:html -- --slug <slug>` (or omit `--slug` for all)
3. Verify `meta.json` `"hero"` still matches the final WebP filename.
4. Spot-check that no HTML/CSS still points at deleted `.png`/`.jpg`/`.jpeg` sources after WebP conversion.
5. Optionally `npm run check:contract -- <slug>` then `/qa-sweep`.
6. Do not commit unless asked — see @.agents/rules/03-repo-safety.md.
