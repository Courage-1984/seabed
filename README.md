# illegal-automation

Daily Builds hub: a Vite multi-page app that hosts fictional brand websites under `sites/` and deploys to GitHub Pages.

## How it works

1. A **Google Gemini** run generates a daily website brief (operator’s live system prompt may be maintained outside the repo; snapshot: [`.agents/prompts/daily-brief-generator.md`](.agents/prompts/daily-brief-generator.md)).
2. Open this repo in **Antigravity IDE** or **Cursor**, paste the brief into agent chat (briefs start with `# Website Build Brief — …`; ignore any `VARIETY ENGINE AUDIT` HTML comment when building).
3. Agent governance **auto-detects** the brief and runs: parse → research-and-plan → scaffold → design (builder authors directed copy + layout signature) → images (WebP) → optimize → contract → build → QA → ship-gate. **AGENTS.md** wins if brief §2/§8 lags.
4. Push to `main` (when you ask) triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Brief highlights

- **Copy split:** Gemini writes voice + hero + one flagship; builder authors the rest within word floors/ceilings.
- **Structure:** Page count and layout family (11 families with mandatory structural signatures) from the variety engine.
- **§10 Antigravity Handoff:** Research angles, planning, skills order, and image-gen briefs.
- **Quality gates:** Layout signature + L/R hard cap; WebP; `Responsive: PASS desktop + mobile` before `qa: v2-pass`.

## Site layout (v2)

```
sites/<kebab-slug>/
  meta.json      # title, blurb, hero, layoutFamily, created, wordFloor?, standard, qa
  index.html
  style.css
  main.js
  assets/
    favicon.svg
    *.webp
```

The hub (`index.html` + `hub.js` + `hub.css`) discovers every `sites/*/meta.json`, sorts by `created` (newest first), and shows a slow infinite discovery strip, a latest-drop stage, and a filterable archive gallery (All · `layoutFamily` chips · Recent). Adding a site only requires a valid `meta.json` — do not edit hub files for daily builds. `layoutFamily` + roster feed Gemini via `npm run sites:index`.

## Commands

```bash
npm install
npm run dev              # local hub + sites
npm run build            # output to dist/
npm run preview          # serve dist/
npm run optimize:webp    # PNG/JPEG → WebP (+ -- --slug <slug>)
npm run optimize:html    # lazy-load / dimensions (+ -- --slug <slug>)
npm run qa               # Puppeteer sweep (build first). npm run qa -- <slug>
npm run check:contract -- <slug|--all>   # static meta/favicon/WebP/path gate
npm run check:ship -- <slug> [--floor N] # copy-depth + contract + qa-report
npm run sites:index      # regenerate .agents/prompts/_sites-index.md for Gemini paste
npm run check:copy-depth -- <slug> [floor]   # word-floor gate (or meta.wordFloor)
```

## Antigravity / Cursor / Gemini agent files

| Path | Role |
|------|------|
| [`AGENTS.md`](AGENTS.md) | Operating procedure — brief auto-detect + pipeline |
| [`GEMINI.md`](GEMINI.md) | Project context and defaults |
| [`.agents/rules/`](.agents/rules/) | Always-on / model-decision constraints |
| [`.agents/skills/`](.agents/skills/) | Pipeline: parse-brief → research-and-plan → scaffold-site → design-and-build → acquire-images → qa-and-ship; optional: qa-sweep-single, qa-sweep-all |
| [`.agents/workflows/`](.agents/workflows/) | Optional recovery: `/qa-sweep`, `/optimize-assets`, `/upgrade-site-v2` (legacy) |
| [`.agents/mcp_config.json`](.agents/mcp_config.json) | Workspace MCP servers (empty by default) |
| [`.agents/prompts/daily-brief-generator.md`](.agents/prompts/daily-brief-generator.md) | Gemini system prompt **snapshot** (live prompt may be external) |
| [`.agents/prompts/_sites-index.md`](.agents/prompts/_sites-index.md) | Generated sites list — paste into Scheduled Action (~weekly) |
| [`.agents/hooks.json`](.agents/hooks.json) | Lightweight governance warnings on edit |

**Cursor** is an alternate builder IDE using the same [`AGENTS.md`](AGENTS.md) and [`.agents/skills/`](.agents/skills/) as Antigravity. Workspace customizations live under [`.agents/`](.agents/) (Antigravity-native); do not duplicate into a portable plugin unless packaging for reuse.

Image generation uses built-in Antigravity/Gemini tools; public-domain / open-license photos are preferred when they fit — see [`.agents/skills/acquire-images/`](.agents/skills/acquire-images/).

## Gemini brief prompt

1. Keep your **live** system prompt outside the repo (or sync from the snapshot in [`.agents/prompts/daily-brief-generator.md`](.agents/prompts/daily-brief-generator.md)).
2. Run `npm run sites:index` periodically and paste **Existing sites** + **Roster** from [`.agents/prompts/_sites-index.md`](.agents/prompts/_sites-index.md) into your prompt.
3. Each run should emit a brief starting with `# Website Build Brief — <Brand> — <YYYY-MM-DD>`, optional Variety Engine Audit HTML comment, then §§1–10.
4. Paste that brief into Antigravity or Cursor — the auto-pipeline takes over (builders ignore the audit comment; follow [AGENTS.md](AGENTS.md) for ship gates).
