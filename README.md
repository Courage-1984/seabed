# illegal-automation

Daily Builds hub: a Vite multi-page app that hosts fictional brand websites under `sites/` and deploys to GitHub Pages.

## How it works

1. A **Google Gemini Scheduled Action** generates a daily website brief using the **v4** system prompt in [`.agents/prompts/daily-brief-generator.md`](.agents/prompts/daily-brief-generator.md) (copy that file into the Scheduled Action instructions).
2. Open this repo in **Antigravity IDE** or **Cursor**, paste the brief into agent chat (briefs start with `# Website Build Brief — …`).
3. Agent governance **auto-detects** the brief and runs: parse → research-and-plan → scaffold → design (Antigravity authors directed copy) → images (WebP) → optimize → build → QA with responsive confirm.
4. Push to `main` (when you ask) triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### v4 brief highlights

- **Copy split:** Gemini writes voice + hero + one flagship; Antigravity authors the rest within word floors/ceilings.
- **Structure:** Page count and layout family vary by date hash (not only weekday).
- **§10 Handoff:** Research angles, planning, skills order, and image-gen briefs for Antigravity.
- **Quality gates:** Optimized WebP photos; `Responsive: PASS desktop + mobile` before `qa: v2-pass`.

## Site layout (v2)

```
sites/<kebab-slug>/
  meta.json      # title, blurb, hero, standard, qa
  index.html
  style.css
  main.js
  assets/
    favicon.svg
    *.webp
```

The hub (`hub.js`) discovers every `sites/*/meta.json` automatically.

## Commands

```bash
npm install
npm run dev              # local hub + sites
npm run build            # output to dist/
npm run preview          # serve dist/
npm run optimize:webp    # PNG/JPEG → WebP + rewrite refs
npm run optimize:html    # lazy-load / dimensions
npm run qa               # Puppeteer sweep (build first)
npm run sites:index      # regenerate .agents/prompts/_sites-index.md for Gemini paste
```

## Antigravity / Cursor / Gemini agent files

| Path | Role |
|------|------|
| [`AGENTS.md`](AGENTS.md) | Operating procedure — brief auto-detect + pipeline |
| [`GEMINI.md`](GEMINI.md) | Project context and defaults |
| [`.agents/rules/`](.agents/rules/) | Always-on / model-decision constraints |
| [`.agents/skills/`](.agents/skills/) | parse-brief, research-and-plan, scaffold-site, design-and-build, acquire-images, qa-and-ship |
| [`.agents/workflows/`](.agents/workflows/) | Optional recovery: `/qa-sweep`, `/optimize-assets`, `/upgrade-site-v2` |
| [`.agents/mcp_config.json`](.agents/mcp_config.json) | Workspace MCP servers (empty by default) |
| [`.agents/prompts/daily-brief-generator.md`](.agents/prompts/daily-brief-generator.md) | Gemini Scheduled Action system prompt (**v4**) |
| [`.agents/prompts/_sites-index.md`](.agents/prompts/_sites-index.md) | Generated sites list — paste into Scheduled Action (~weekly) |
| [`.agents/hooks.json`](.agents/hooks.json) | Lightweight governance warnings on edit |

**Cursor** is an alternate builder IDE using the same [`AGENTS.md`](AGENTS.md) and [`.agents/skills/`](.agents/skills/) as Antigravity.

Image generation uses built-in Antigravity/Gemini tools; public-domain / open-license photos are preferred when they fit — see [`.agents/skills/acquire-images/`](.agents/skills/acquire-images/).

## Gemini Scheduled Action

1. Open [`.agents/prompts/daily-brief-generator.md`](.agents/prompts/daily-brief-generator.md).
2. Copy the system prompt (everything under the “Copy everything below this line…” marker) into your Gemini Scheduled Action instructions (**replace any v3 prompt**).
3. Run `npm run sites:index` and paste the **Existing sites** section from [`.agents/prompts/_sites-index.md`](.agents/prompts/_sites-index.md) into the same instructions (~weekly).
4. Each run should emit a brief starting with `# Website Build Brief — <Brand> — <YYYY-MM-DD>` including §§1–10.
5. Paste that brief into Antigravity or Cursor — the auto-pipeline takes over.
