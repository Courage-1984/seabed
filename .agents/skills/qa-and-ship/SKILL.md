---
name: qa-and-ship
description: Builds the project, runs Puppeteer QA, confirms WebP images and responsive PASS on desktop and mobile, then marks meta.json qa as v2-pass only when clean. Use when finishing a site, running QA, verifying hub cards, or shipping a daily build.
---

# QA and ship

## Goal

Verify the new (or upgraded) site in the MPA build and hub. Enforce WebP per @.agents/skills/acquire-images/SKILL.md. Confirm **responsive** desktop + mobile. Git/deploy constraints: @.agents/rules/03-repo-safety.md.

## Steps

1. From repo root: `npm run build`
2. **Copy depth (fail-qa-10pct):** Run `node scripts/check-copy-depth.js <slug> <floor>` using §3 word floor from the parsed brief. If it exits non-zero, expand §4b copy and re-check before proceeding.
3. Run: `npm run qa` (preview on `dist/`, writes `qa-report.json` + `qa-screenshots/`)
4. Read `qa-report.json` for the new site’s HTML paths and the hub (`index.html`).
5. Fix failures in priority order:
   - Copy depth fail (`COPY_DEPTH_FAIL` from step 2)
   - Broken images (`naturalWidth === 0`)
   - Non-WebP photographic `<img src>` (`nonWebpPhotos` in report)
   - Horizontal overflow on mobile/desktop
   - Console errors
   - Hub card missing image/favicon
6. **WebP check (canonical gate):** Enforce @.agents/skills/acquire-images/SKILL.md — every photographic `<img src>` must end in `.webp` (SVG ok for favicon/icons). `scripts/qa_sweep.js` reports `nonWebpPhotos`; fix via `acquire-images` / optimize, then re-QA.
7. **Responsive confirm:** From `qa-report.json` and screenshots for this site:
   - Mobile (~390) — no overflow, no broken images, no non-WebP photos
   - Desktop (~1280+) — no overflow, no broken images, no non-WebP photos
   - Emit an explicit line in your summary: `Responsive: PASS desktop + mobile` **or** `Responsive: FAIL` with what you will fix
8. Re-run build + QA until clean **and** responsive PASS **and** copy depth PASS.
9. Update `sites/<slug>/meta.json`:
   - `"standard": "v2"`
   - `"qa": "v2-pass"` — **only** after step 8 (clean QA + responsive PASS + copy depth + WebP)
10. Summarize for the user:
   - Slug and pages added
   - Image strategy per major asset + WebP confirmed
   - Copy depth result (`COPY_DEPTH_PASS` wording)
   - `Responsive: PASS desktop + mobile` (required wording when shipping)
   - QA status
   - Remaining risks
   - Commit/push waiting on their request

## Do not

- Set `"qa": "v2-pass"` while overflow, broken images, non-WebP photos, or copy below floor −10% remain.
- Commit, push, or open PRs unless explicitly asked — @.agents/rules/03-repo-safety.md.
- “Fix” unrelated sites unless you introduced a regression.
