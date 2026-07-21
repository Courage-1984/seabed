---
name: qa-and-ship
description: Builds the project, runs Puppeteer QA, confirms WebP images and responsive PASS on desktop and mobile, then marks meta.json qa as v2-pass only when clean. Use when finishing a site, running QA, verifying hub cards, or shipping a daily build.
---

# QA and ship

## Goal

Verify the new (or upgraded) site in the MPA build and hub. Confirm **WebP** photos and **responsive** desktop + mobile. Do **not** git commit/push unless the user asks.

## Steps

1. From repo root: `npm run build`
2. Run: `npm run qa` (preview on `dist/`, writes `qa-report.json` + `qa-screenshots/`)
3. Read `qa-report.json` for the new site’s HTML paths and the hub (`index.html`).
4. Fix failures in priority order:
   - Broken images (`naturalWidth === 0`)
   - Horizontal overflow on mobile/desktop
   - Console errors
   - Hub card missing image/favicon
5. **WebP check:** In the new site’s HTML, photographic `src`s must end in `.webp` (SVG ok for favicon/icons). If PNG/JPEG remain as live sources, fix via `acquire-images` / optimize, then re-QA.
6. **Responsive confirm:** From `qa-report.json` and screenshots for this site:
   - Mobile (~390) — no overflow, no broken images
   - Desktop (~1280+) — no overflow, no broken images
   - Emit an explicit line in your summary: `Responsive: PASS desktop + mobile` **or** `Responsive: FAIL` with what you will fix
7. Re-run build + QA until clean **and** responsive PASS.
8. Update `sites/<slug>/meta.json`:
   - `"standard": "v2"`
   - `"qa": "v2-pass"` — **only** after step 7
9. Summarize for the user:
   - Slug and pages added
   - Image strategy per major asset + WebP confirmed
   - `Responsive: PASS desktop + mobile` (required wording when shipping)
   - QA status
   - Remaining risks
   - Commit/push waiting on their request

## Do not

- Set `"qa": "v2-pass"` while overflow, broken images, or non-WebP photos remain.
- Commit, push, or open PRs unless explicitly asked.
- “Fix” unrelated sites unless you introduced a regression.
