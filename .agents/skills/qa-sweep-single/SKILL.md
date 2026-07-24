---
name: qa-sweep-single
description: Runs the Puppeteer QA sweep for a single site and visually verifies the responsive display on mobile and desktop using generated screenshots.
---

# QA Sweep Single

## Goal

Run the QA sweep for one site slug, check `qa-report.json` `summary` and page entries, and visually verify mobile/desktop screenshots.

## Preconditions

- The site must exist under `sites/<slug>/`.
- Built: `npm run build`.

## Procedure

1. **Run Sweep:** `npm run qa -- <slug>` (includes hub; use `-- --no-hub` to skip hub). Generates `qa-screenshots/*_{mobile,desktop}.png` unless `CI=true`.
2. **Technical Check:** Read `qa-report.json`:
   - Prefer top-level `summary.pass` and `summary.counts`
   - For `pages` under `sites/<slug>/`: fail on `overflowingElements`, `brokenImages`, `nonWebpPhotos`, `missingAltTags`, console/network/brokenLinks, or `error`
3. **Visual Verification:** Load `qa-screenshots/*_mobile.png` and `*_desktop.png` for the site and inspect for overlap/clipping.
4. **Assessment:** Confirm no visual artifacts or improper styling.

## Next

If clean, finish via @.agents/skills/qa-and-ship/SKILL.md (`check:ship` + meta gates) before `"qa": "v2-pass"`.
