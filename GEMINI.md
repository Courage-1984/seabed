# Project Context — illegal-automation

**Producer context** for Gemini Scheduled Action and project defaults. **Builder operating procedure** (pipeline, commands, QA gates): @AGENTS.md.

## What this is

A **Daily Builds** portfolio: one static Vite multi-page app that hosts many fictional brand websites under `sites/`, listed from the root hub. Push to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

Daily creative briefs arrive from a **Google Gemini Scheduled Action**. The canonical system prompt is @./.agents/prompts/daily-brief-generator.md (**v4** — copy split, layout/architecture variety, §10 Antigravity handoff). Copy it into the Scheduled Action UI. Paste the generated brief into **Antigravity** or **Cursor** — auto-starts the build pipeline per @AGENTS.md.

### Sites index for Gemini (manual-weekly)

Gemini has **no repo access**. Regenerate @./.agents/prompts/_sites-index.md with `npm run sites:index` and paste the **Existing sites** table into your Saved Scheduled Action instructions (~weekly) so briefs avoid slug/layout collisions.

## Stack

- **Build:** Vite 8 MPA (`base: './'` for GitHub Pages relative paths)
- **Per site:** vanilla HTML, CSS, and JS — no React, no Tailwind, no per-site bundler
- **Hub:** `index.html` + `hub.js` + `hub.css` — discovers `./sites/*/meta.json`
- **Assets:** WebP photos, SVG favicons; optimize via `scripts/convert-webp.js` and `scripts/optimize-html.js`
- **QA:** Puppeteer sweep in `scripts/qa_sweep.js` → `qa-report.json` + `qa-screenshots/`

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
| `.agents/prompts/daily-brief-generator.md` | System prompt v4 that *produces* daily briefs (paste into Gemini Scheduled Action) |
| `.agents/prompts/_sites-index.md` | Generated slug/title index — paste into Scheduled Action (~weekly) |
| `.agents/hooks.json` | Lightweight PostToolUse warnings (qa:v2-pass, non-WebP img) |

## Alternate builder: Cursor

Cursor is a supported alternate builder IDE — same @AGENTS.md + `.agents/skills/` pipeline as Antigravity.
