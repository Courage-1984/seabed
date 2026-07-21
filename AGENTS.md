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
5. Load skill `acquire-images` — PD/open vs generate (WebP per @.agents/skills/acquire-images/SKILL.md).
6. Optimize assets:
   - `npm run optimize:webp`
   - `npm run optimize:html`
7. Load skill `qa-and-ship`:
   - `npm run build`
   - `npm run qa`
   - Confirm `Responsive: PASS desktop + mobile` and WebP per @.agents/skills/acquire-images/SKILL.md
8. Set `meta.json` `"standard": "v2"` and `"qa": "v2-pass"` per @.agents/skills/qa-and-ship/SKILL.md gate only.
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
| Regenerate sites index (Gemini paste) | `npm run sites:index` |
| Copy depth check (floor from brief §3) | `npm run check:copy-depth -- <slug> <floor>` |

`npm run qa` starts preview against the built `dist/` — always `npm run build` first. QA fails on overflow, broken images, non-WebP photos, or console errors.

## Hub contract

See @.agents/rules/01-site-v2-standard.md (hub integration + meta schema + paths).

## Off-limits

See @.agents/rules/03-repo-safety.md.

## Optional recovery workflows

Primary path is brief auto-detect. Slash workflows exist only for recovery:

- `/qa-sweep` — rebuild + QA + interpret `qa-report.json`
- `/optimize-assets` — WebP + HTML optimize for a slug or all
- `/upgrade-site-v2` — flatten a legacy nested Vite site to v2
