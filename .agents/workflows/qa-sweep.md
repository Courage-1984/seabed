---
description: Rebuild the project and run the Puppeteer QA sweep; interpret qa-report.json and fix failures
---

# /qa-sweep

Recovery workflow when a site already exists or QA needs a re-run. (New briefs auto-run QA via `qa-and-ship` — this is for manual recovery.)

## Steps

1. From repo root: `npm run check:contract -- <slug|--all>`
2. If shipping a site with a known §3 word floor: `npm run check:copy-depth -- <slug> <floor>` (or `meta.wordFloor`).
3. `npm run build`
4. `npm run qa` or `npm run qa -- <slug>` (hub included with slug by default; `-- --no-hub` to skip; `CI=true` skips screenshots).
5. Open `qa-report.json` — prefer `summary.pass` / `summary.counts`, then failing `pages[]`:
   - `overflowingElements`
   - `brokenImages`
   - `nonWebpPhotos` (img + CSS backgrounds)
   - `missingAltTags`
   - console / network / brokenLinks
6. Fix issues in the relevant `sites/<slug>/` (or hub) files.
7. Repeat until clean; for a ship candidate run `npm run check:ship -- <slug> --floor <n>`.
8. For sites that pass, set `"standard": "v2"`, `"layoutFamily"`, and `"qa": "v2-pass"` per @.agents/skills/qa-and-ship/SKILL.md.
9. Report results; do not commit unless asked — @.agents/rules/03-repo-safety.md.
