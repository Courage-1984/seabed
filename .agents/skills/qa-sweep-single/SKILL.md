---
name: qa-sweep-single
description: Runs the Puppeteer QA sweep for a single site and visually verifies the responsive display on mobile and desktop using generated screenshots.
---

# QA Sweep Single

## Goal

Run the QA sweep script for a single site slug, check for technical errors in the report, and visually verify that the site displays properly on mobile and desktop by inspecting the generated screenshots.

## Preconditions

- The site must exist under `sites/<slug>/`.
- The site must be fully built (e.g., `npm run build`).

## Procedure

1. **Run Sweep:** Execute `node qa_sweep.js <slug>` from the repository root. This runs Puppeteer and generates screenshots in `qa-screenshots/`.
2. **Technical Check:** Read `qa-report.json` to verify if there are any technical failures (such as `overflow: true`, missing WebP images, or broken links).
3. **Visual Verification:** Locate the mobile and desktop `.webp` screenshots for the site in the `qa-screenshots/` folder. Load these screenshots into your context to visually inspect them.
4. **Assessment:** Confirm there are no visual artifacts, text overlapping, or improper styling. 

## Next

If the sweep passes and the visual verification is pristine, you can proceed to update `meta.json` with `"qa": "v2-pass"`.
