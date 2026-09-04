# Agent Instructions — illegal-automation

Static Vite MPA hub of daily fictional brand websites, deployed to GitHub Pages. Each site lives under a chronological bucket `sites/<YYYY-MM>/<kebab-slug>/` and appears on the hub via recursive `meta.json` discovery in `hub.js`. All CLI scripts accept bare `<kebab-slug>` names across subdirectories.

## Brief auto-detection (mandatory)

If the user message looks like a **website brief** — brand name, concept, audience, tone, pages, visual direction, CTAs, or similar structured creative brief — **immediately** run the full build pipeline below. Do not wait for “build this” or a slash command.

Only pause to ask **one** clarifying question when critical fields are missing (brand name or core concept). Otherwise proceed autonomously.

## Full pipeline (ordered)

1. Load skill `parse-brief` — extract structured checklist.
2. Load skill `research-and-plan` — execute §10 handoff research/planning (bounded).
3. Load skill `scaffold-site` — create `sites/<slug>/` tree.
4. Load skill `design-and-build` — implement HTML/CSS/JS; author §4b directed copy; apply layout family.
5. Load skill `acquire-images` — PD/open vs generate (WebP per @.agents/skills/acquire-images/SKILL.md).
6. Optimize assets (prefer slug scope):
   - `npm run optimize:webp -- --slug <slug>`
   - `npm run optimize:html -- --slug <slug>`
7. Load skill `qa-and-ship`:
   - `npm run check:contract -- <slug>`
   - `npm run check:copy-depth -- <slug> <floor>` (or rely on `meta.wordFloor`)
   - `npm run build`
   - `npm run qa -- <slug>`
   - `npm run check:ship -- <slug> --floor <floor>`
   - Confirm layout family’s structural signature from the brief was implemented (self-check)
   - Confirm `Responsive: PASS desktop + mobile` and WebP per @.agents/skills/acquire-images/SKILL.md
   - **Extreme Visual Audit**: Review the generated screenshots in `qa-screenshots/` (or run a visual accessibility tool) to independently verify that every page renders flawlessly from top to bottom (no overlapping text, correct minimum font sizes, and unbroken flex/grid containers) before marking `qa: "v2-pass"`.

**Note:** Pasted briefs §2/§8 should match this command list (see `.agents/prompts/daily-brief-generator.md`). If a brief is somehow thinner, **this file wins**. 
8. Set `meta.json` `"standard": "v2"`, `"layoutFamily"`, `"tags"`, `"created"` (UTC `YYYY-MM-DD`), `"wordFloor"` when known, and `"qa": "v2-pass"` per @.agents/skills/qa-and-ship/SKILL.md gate only. 
   - **CRITICAL RULE**: Do not set `"qa": "v2-pass"` unless ALL image assets AND the implemented video (webm/mp4) are physically present and integrated into the new website build.
9. Summarize: slug, pages, layout family, created date, image strategy per asset, copy depth, responsive status, QA status, remaining risks. 
10. After ship (operator): `npm run sites:index` and paste Roster + Existing sites table into the live Gemini prompt (~weekly).
11. **Video Generation Handoff**: At the very end of the build summary, you MUST provide the user with a detailed text prompt to generate a cinematic video for the site. The prompt MUST explicitly request "720p" and "16:9 aspect ratio". The user will download the generated video into `./videos_new/`. When they notify you, you must web-optimize the video (e.g. ffmpeg to webm), move it to the site's `assets/` directory, and implement it on the site.
   - **Video Integration Matrix (Mandatory Governance Rule)**: Do NOT default to placing the video as the hero background for every site. You MUST determine the video placement based on the day of the month the site is created (e.g. `YYYY-MM-DD` -> DD):
     - **Days 01-06**: *Hero Background* — Full-bleed looping ambient background behind the primary hero text.
     - **Days 07-12**: *Inline Product/Process Demo* — Embed prominently in a content section (e.g. Section 2 or 3) as a standalone video player or alongside text.
     - **Days 13-18**: *Footer Ambient Loop* — Ambient motion backdrop for the final call-to-action or footer elements.
     - **Days 19-24**: *Sticky Rail / Split Panel* — Place in a sticky rail or fixed side-panel, looping continuously while content scrolls (or in an asymmetric split section).
     - **Days 25-31**: *Hover / Interaction Reveal* — Video plays on hover over a prominent element, or acts as a dynamic transition background between sections.

## CSS Best Practices (Mandatory)

The builder must codify and adhere strictly to the following CSS spacing and layout rules for all responsive breakpoints:
- **padding:** Use for internal click targets and spacing (shares background).
- **margin:** Use ONLY to push unrelated sections apart or center blocks. Never use hacky margins for flex/grid gaps.
- **gap:** MUST be used for equal spacing between flex/grid items.
- **inset / logical spacing:** Use logical properties (`margin-block`, `padding-inline`, `block-size`, `inset`) instead of physical directions (`top`, `width`) wherever applicable.
- **Scroll Boundaries:** Implement `scroll-padding` or `scroll-margin` to ensure fixed headers do not obscure anchor links.
- **Justification:** Use `justify-content` (space-between/around/evenly) for dynamic gap distribution.

## Commands

| Task                                  | Command                                                 |
| ------------------------------------- | ------------------------------------------------------- |
| Dev server                            | `npm run dev`                                           |
| Production build                      | `npm run build`                                         |
| Preview build                         | `npm run preview`                                       |
| PNG/JPEG → WebP                       | `npm run optimize:webp` (`-- --slug <slug>` to scope)   |
| Lazy-load / dimensions                | `npm run optimize:html` (`-- --slug <slug>` to scope)   |
| Puppeteer QA sweep                    | `npm run qa` (`-- <slug>`; `CI=true` skips screenshots) |
| Static site contract                  | `npm run check:contract -- <slug\|--all>`               |
| Ship gate (copy + contract + report)  | `npm run check:ship -- <slug> [--floor N]`              |
| Regenerate sites index (Gemini paste) | `npm run sites:index`                                   |
| Copy depth check                      | `npm run check:copy-depth -- <slug> [floor]`            |
| Code Quality: Lint                    | `npm run lint`                                          |
| Code Quality: Format                  | `npm run format`                                        |

`npm run qa` starts preview against the built `dist/` — always `npm run build` first. QA fails on overflow, broken images, non-WebP photos (img + CSS), missing alt, console/network errors, or broken internal links. Report shape: `{ summary, pages }` in `qa-report.json`.

## Hub contract

See @.agents/rules/01-site-v2-standard.md (hub integration + meta schema + paths).

## Off-limits

See @.agents/rules/03-repo-safety.md.

## Optional recovery workflows

Primary path is brief auto-detect. Slash workflows exist only for recovery:

- `/qa-sweep` — rebuild + QA + interpret `qa-report.json`
- `/optimize-assets` — WebP + HTML optimize for a slug or all
- `/upgrade-site-v2` — legacy recovery only: flatten a nested Vite site to v2 (current tree is already flat)
