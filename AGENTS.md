# Agent Instructions — illegal-automation

Static Vite MPA hub of daily fictional brand websites, deployed to GitHub Pages. Each site lives under `sites/<kebab-slug>/` and appears on the hub via `meta.json` discovery in `hub.js`.

## Brief auto-detection (mandatory)

If the user message looks like a **website brief** — brand name, concept, audience, tone, pages, visual direction, CTAs, or similar structured creative brief — **immediately** run the full build pipeline below. Do not wait for “build this” or a slash command.

Only pause to ask **one** clarifying question when critical fields are missing (brand name or core concept). Otherwise proceed autonomously.

## Full pipeline (ordered)

1. Load skill `parse-brief` — extract structured checklist.
2. Load skill `research-and-plan` — execute §10 handoff research/planning (bounded).
3. Load skill `scaffold-site` — create `sites/<slug>/` tree.
4. Load skill `design-and-build` — implement HTML/CSS/JS; author §4b directed copy; apply layout family.
5. Load skill `acquire-images` — PD/open vs generate; **WebP only** for photos.
6. Optimize assets:
   - `npm run optimize:webp`
   - `npm run optimize:html`
7. Load skill `qa-and-ship`:
   - `npm run build`
   - `npm run qa`
   - Confirm `Responsive: PASS desktop + mobile` and WebP srcs
8. Set `meta.json` `"standard": "v2"` and `"qa": "v2-pass"` **only after QA is clean and responsive PASS**.
9. Summarize: slug, pages, image strategy per asset, responsive status, QA status, remaining risks.

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Preview build | `npm run preview` |
| PNG/JPEG → WebP | `npm run optimize:webp` |
| Lazy-load / dimensions | `npm run optimize:html` |
| Puppeteer QA sweep | `npm run qa` |

`npm run qa` starts preview against the built `dist/` — always `npm run build` first.

## Hub contract

- New sites must appear via `sites/<slug>/meta.json` alone.
- Do **not** change `hub.js`, `vite.config.js`, or the hub `index.html` unless discovery/build is broken.
- Hero path in `meta.json` must match a real file under that site’s `assets/` (prefer `assets/hero.webp` or equivalent WebP).

## Off-limits

- Never edit `node_modules/`, `dist/`, or `.env`.
- Never create a nested `package.json` / Vite app inside a site folder (v2 = flat static HTML/CSS/JS).
- Do not break or rewrite unrelated existing sites while adding a new one.
- Do not `git commit` or `git push` unless the user explicitly asks.
- Do not force-deploy or change GitHub Pages settings unless asked.

## Optional recovery workflows

Primary path is brief auto-detect. Slash workflows exist only for recovery:

- `/qa-sweep` — rebuild + QA + interpret `qa-report.json`
- `/optimize-assets` — WebP + HTML optimize for a slug or all
- `/upgrade-site-v2` — flatten a legacy nested Vite site to v2
