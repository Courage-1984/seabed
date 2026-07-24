---
name: qa-sweep-all
description: Runs a comprehensive repo-wide QA sweep across all sites and summarizes the results from the report.
---

# QA Sweep All

## Goal

Run the QA sweep across every site and summarize failures from `qa-report.json` without loading every screenshot.

## Preconditions

- Built: `npm run build`.
- Prefer `npm run check:contract -- --all` first for fast static failures.

## Procedure

1. **Run Sweep:** `npm run qa` from the repository root (no slug). Use `CI=true` to skip screenshots when summarizing only.
2. **Analyze Report:** Read `qa-report.json` → `summary.pass`, `summary.failedPages`, `summary.counts`. If exit code is non-zero, list failing `pages[].path`.
3. **Summarize Failures:** Group by slug from failing paths (overflow, broken images, non-WebP, missing alt, console, links).
4. **Report to User:** Clear summary of which sites need attention. Do not load all screenshots.

## Next

Present the summary and suggest fixes; use `qa-sweep-single` for visual confirmation on specific slugs.
