---
description: Rebuild the project and run the Puppeteer QA sweep; interpret qa-report.json and fix failures
---

# /qa-sweep

Recovery workflow when a site already exists or QA needs a re-run. (New briefs auto-run QA via `qa-and-ship` — this is for manual recovery.)

## Steps

1. From repo root: `npm run build`
2. `npm run qa`
3. Open `qa-report.json` and summarize failures by path (overflow, broken images, hub links, console errors).
4. Fix issues in the relevant `sites/<slug>/` (or hub) files.
5. Repeat build + QA until clean.
6. For sites that pass, set `"standard": "v2"` and `"qa": "v2-pass"` per @.agents/skills/qa-and-ship/SKILL.md.
7. Report results; do not commit unless asked — @.agents/rules/03-repo-safety.md.
