---
name: qa-and-ship
description: Builds the project, runs Puppeteer QA, confirms WebP images and responsive PASS on desktop and mobile, then marks meta.json qa as v2-pass only when clean. Use when finishing a site, running QA, verifying hub cards, or shipping a daily build.
---

# QA and ship

## Goal

Verify the new (or upgraded) site in the MPA build and hub. Enforce WebP per @.agents/skills/acquire-images/SKILL.md. Confirm **responsive** desktop + mobile. Git/deploy constraints: @.agents/rules/03-repo-safety.md.

If the pasted brief’s §2 / §8 omit `check:contract`, `check:ship`, `layoutFamily`, or `wordFloor`, still follow this skill and @AGENTS.md (AGENTS wins).

Before marking pass: confirm the brief’s **layout structural signature** is visibly implemented and the L/R split hard cap was respected (agent self-check — not a Puppeteer field).

## Steps

1. From repo root: `npm run check:contract -- <slug>` (meta, layoutFamily, hero file, favicon, no raster leftovers).
2. **Copy depth (fail-qa-10pct):** `npm run check:copy-depth -- <slug> <floor>` using §3 word floor (or set `meta.wordFloor` and omit floor). If it exits non-zero, expand §4b copy and re-check before proceeding.
3. `npm run build`
4. `npm run qa -- <slug>` (includes hub `index.html` by default; writes `qa-report.json` with `summary` + `pages`, plus screenshots unless `CI=true`).
5. `npm run check:ship -- <slug> --floor <floor>` — re-checks copy-depth + contract + clean report pages for the slug and hub. Prefer this over hand-parsing the report; still confirm `summary` for the slug.
6. Fix failures in priority order:
   - `CONTRACT_FAIL` / `COPY_DEPTH_FAIL` / `SHIP_FAIL`
   - Broken images (`naturalWidth === 0`)
   - Non-WebP photographic `<img>` / CSS `url(...)` (`nonWebpPhotos`)
   - Missing `alt` (`missingAltTags`)
   - Horizontal overflow on mobile/desktop
   - Console / network / broken internal links
7. **WebP check (canonical gate):** Enforce @.agents/skills/acquire-images/SKILL.md — every photographic asset must be `.webp` (SVG ok for favicon/icons). `scripts/qa_sweep.js` reports `nonWebpPhotos`; fix via `acquire-images` / optimize, then re-QA.
8. **Responsive confirm:** From `qa-report.json` (`summary` + site pages) and screenshots:
   - Mobile (~390) — no overflow, no broken images, no non-WebP photos, alts present
   - Desktop (~1440) — same
   - Emit: `Responsive: PASS desktop + mobile` **or** `Responsive: FAIL` with what you will fix
9. Re-run build + QA + `check:ship` until clean **and** responsive PASS **and** copy depth PASS.
10. Update `sites/<slug>/meta.json`:
   - `"standard": "v2"`
   - `"layoutFamily": "<exact family from brief §3 / design-and-build>"`
   - `"created": "<YYYY-MM-DD>"` — UTC ship/build day (set at scaffold; confirm here if missing)
   - `"wordFloor": <n>` when known from brief §3 (helps future `check:copy-depth` / `check:ship`)
   - `"qa": "v2-pass"` — **only** after step 9
11. Summarize for the user:
   - Slug and pages added
   - Image strategy per major asset + WebP confirmed
   - Copy depth result (`COPY_DEPTH_PASS` wording)
   - `Responsive: PASS desktop + mobile` (required wording when shipping)
   - QA / `SHIP_PASS` status
   - Remaining risks
   - Commit/push waiting on their request

## Do not

- Set `"qa": "v2-pass"` while overflow, broken images, non-WebP photos, missing alt, or copy below floor −10% remain.
- Commit, push, or open PRs unless explicitly asked — @.agents/rules/03-repo-safety.md.
- “Fix” unrelated sites unless you introduced a regression.
