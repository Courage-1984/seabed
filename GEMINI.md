# Project Context — illegal-automation

**Producer context** for Gemini Scheduled Action and project defaults. **Builder operating procedure** (pipeline, commands, QA gates): @AGENTS.md.

## What this is

A **Daily Builds** portfolio: one static Vite multi-page app that hosts many fictional brand websites under `sites/`, listed from the root hub (slow discovery strip + latest drop + archive filtered by `layoutFamily` / recent, sorted by `meta.created`). Push to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

Daily creative briefs arrive from a **Google Gemini Scheduled Action** (operator may keep the live system prompt outside the repo). Checked-in snapshot: @./.agents/prompts/daily-brief-generator.md. Paste the generated brief into **Antigravity** or **Cursor** — auto-starts the build pipeline per @AGENTS.md (AGENTS wins if brief §2/§8 is thinner than current ship gates).


### Sites index for Gemini (manual-weekly)

Gemini has **no repo access**. After shipping new sites (or ~weekly), regenerate @./.agents/prompts/_sites-index.md with `npm run sites:index` and paste **both** the **Existing sites** table **and** the **Roster** block into your Saved Scheduled Action / live prompt (and keep @./.agents/prompts/daily-brief-generator.md in sync). That is the only cross-run collision memory Gemini gets.

## Stack

- **Build:** Vite 8 MPA (`base: './'` for GitHub Pages relative paths)
- **Per site:** vanilla HTML, CSS, and JS — no React, no Tailwind, no per-site bundler
- **Hub:** `index.html` + `hub.js` + `hub.css` — discovers `./sites/*/meta.json`, sorts by `created`, slow discovery strip + latest drop + archive (`layoutFamily` / recent filters)
- **Assets:** WebP photos, SVG favicons; optimize via `scripts/convert-webp.js` and `scripts/optimize-html.js` (`--slug` supported)
- **QA:** `scripts/qa_sweep.js` → `qa-report.json` (`summary` + `pages`); static `check:contract` / ship orchestrator `check:ship`

## Site layout (v2)

See @./.agents/rules/01-site-v2-standard.md and @./.agents/skills/design-and-build/SKILL.md.

```
sites/<kebab-slug>/
  meta.json
  index.html
  style.css
  main.js
  assets/
    favicon.svg
    *.webp
```

Hub cards require `title`, `blurb`, `hero`, `created` (`YYYY-MM-DD`), plus `layoutFamily` / `standard` / `qa` at ship. See @./.agents/rules/01-site-v2-standard.md.

## Defaults

- **Locale:** `en-GB` unless the brief specifies otherwise (builder stubs follow this in `scaffold-site`)
- **Tone:** fictional but credible brands; copy must be specific and useful, not generic AI filler
- **Visual:** distinctive per brief — do not clone yesterday’s layout
- **Fonts / hero craft:** per @.agents/rules/02-frontend-design.md

## Agent entry points

| File | Role |
|------|------|
| `AGENTS.md` | **Builder SOT** — pipeline, commands, QA gates |
| `GEMINI.md` | **Producer context** — this file |
| `.agents/rules/` | Persistent constraints (glob/model/always-on) |
| `.agents/skills/` | How-to expertise (parse → research-and-plan → scaffold → design → images → QA) |
| `.agents/workflows/` | Optional recovery slash commands only |
| `.agents/prompts/daily-brief-generator.md` | System prompt snapshot (live prompt may live outside repo) |
| `.agents/prompts/_sites-index.md` | Generated slug/title/layoutFamily index — paste into Scheduled Action (~weekly) |
| `.agents/hooks.json` | Lightweight PostToolUse warnings (qa:v2-pass, non-WebP img) |

Workspace customizations live under `.agents/` (Antigravity-native rules, skills, workflows, hooks). Portable plugins would use `.agents/plugins/<name>/` with a minimal `plugin.json` — **do not** duplicate this repo’s skills into a plugin bundle for single-repo use.

## Alternate builder: Cursor

Cursor is a supported alternate builder IDE — same @AGENTS.md + `.agents/skills/` pipeline as Antigravity.
