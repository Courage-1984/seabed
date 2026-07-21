# Project Context — illegal-automation

## What this is

A **Daily Builds** portfolio: one static Vite multi-page app that hosts many fictional brand websites under `sites/`, listed from the root hub. Push to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

Daily creative briefs arrive from a **Google Gemini Scheduled Action**. The canonical system prompt is @./.agents/prompts/daily-brief-generator.md (**v4** — copy split, layout/architecture variety, §10 Antigravity handoff). Copy it into the Scheduled Action UI. In Antigravity, pasting a brief (title line `# Website Build Brief — …`) auto-starts the site build pipeline — see `AGENTS.md`.

## Stack

- **Build:** Vite 8 MPA (`base: './'` for GitHub Pages relative paths)
- **Per site:** vanilla HTML, CSS, and JS — no React, no Tailwind, no per-site bundler
- **Hub:** `index.html` + `hub.js` + `hub.css` — discovers `./sites/*/meta.json`
- **Assets:** WebP photos, SVG favicons; optimize via `scripts/convert-webp.js` and `scripts/optimize-html.js`
- **QA:** Puppeteer sweep in `qa_sweep.js` → `qa-report.json` + `qa-screenshots/`

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

- **Locale:** `en-GB` unless the brief specifies otherwise
- **Tone:** fictional but credible brands; copy must be specific and useful, not generic AI filler
- **Visual:** distinctive per brief — do not clone yesterday’s layout
- **Fonts:** expressive, purposeful pairs from Google Fonts (or similar); never Inter, Roboto, Arial, or system UI as the primary display face for **new** sites

## Agent entry points

| File | Role |
|------|------|
| `AGENTS.md` | Operating procedure, pipeline, commands |
| `.agents/rules/` | Persistent constraints |
| `.agents/skills/` | How-to expertise (parse → research-and-plan → scaffold → design → images → QA) |
| `.agents/workflows/` | Optional recovery slash commands only |
| `.agents/prompts/daily-brief-generator.md` | System prompt v4 that *produces* daily briefs (paste into Gemini Scheduled Action) |
