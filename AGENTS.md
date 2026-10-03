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
   - `npm run check:assets -- <slug>` (per-site asset isolation — see §12)
   - `npm run qa:visual -- <slug>` then `npm run check:vision -- <slug>` (§14 — the ship gate fails without it)
   - Confirm layout family’s structural signature from the brief was implemented (self-check)
   - Confirm the motion budget is implemented (§13) and the signature effect is real, not a name in `meta.json`
   - Confirm `Responsive: PASS desktop + mobile` and WebP per @.agents/skills/acquire-images/SKILL.md
   - **Extreme Visual Audit** — mandatory, not optional, and not satisfied by the correctness sweep alone. See §14.

**Note:** Pasted briefs §2/§8 should match this command list (see `.agents/prompts/daily-brief-generator.md`). If a brief is somehow thinner, **this file wins**. 
8. Set `meta.json` `"standard": "v2"`, `"layoutFamily"`, `"tags"`, `"created"` (UTC `YYYY-MM-DD`), `"wordFloor"` when known, `"video"`, `"videoPlacement"`, `"signatureEffect"`, and `"qa": "v2-pass"` per @.agents/skills/qa-and-ship/SKILL.md gate only. 
   - **CRITICAL RULE**: Do not set `"qa": "v2-pass"` unless ALL image assets AND the implemented video (webm + mp4 + poster) are physically present, site-private, and integrated into the new website build.
9. Summarize: slug, pages, layout family, video placement, signature effect, created date, image strategy per asset, copy depth, responsive status, QA status, **Visual Audit findings**, remaining risks. 
10. After ship (operator): `npm run sites:index` and paste the Anti-repetition state + Roster + Existing sites table into the live Gemini prompt (~weekly).

## 11. Video handoff (canonical)

Every site ships **exactly one** video, generated for that site alone.

### 11a. Placement is seeded, never defaulted

The single source of truth for placement slots is `scripts/lib/video-placements.js`. Do not restate the list elsewhere; import it or point here.

There are **twelve** slots: `hero background`, `hero inset frame`, `inline process demo`, `sticky rail loop`, `split panel`, `footer ambient`, `hover reveal`, `section transition band`, `masked type fill`, `grid tile`, `marquee strip`, `modal feature`.

The brief carries the rolled slot. It is resolved as:

```
slotIndex = (seed + 5) % 12
advance slotIndex by +1 until the slot is BOTH
  (a) listed in PLACEMENT_BY_FAMILY[layoutFamily], and
  (b) not among the last 8 sites' videoPlacement values
```

**Never key placement off the day of the month.** That is what produced eight consecutive sites with an identical hover-reveal treatment. If a brief specifies a slot, use it; if it does not, resolve it with `resolvePlacement()` from the registry and the last-8 list in `.agents/prompts/_sites-index.md`.

Each slot has a mandatory implementation spec in `VIDEO_PLACEMENT_SPECS` — a slot name alone is not a spec.

### 11b. Build without the video, then layer it in

The site must look and function **perfectly with no video present**. The video is an enhancement layered into a slot that already works — never a hole in the layout. Ship the poster/still treatment first; the video replaces or overlays it.

### 11c. The video prompt is the last thing in your response

At the very end of every build response you MUST emit a fenced block:

```text
VIDEO GENERATION PROMPT — <slug>  |  placement: <slot>  |  target: sites/<YYYY-MM>/<slug>/assets/<slug>-<slot>.webm

<Subject and setting, specific to THIS brand's niche and nothing else>
<Camera: lens, movement, framing>
<Lighting and time of day>
<Colour palette — named in prose, e.g. "oxidised copper green, sodium-lamp amber". NEVER #rrggbb / hsl() / rgb(): the generator renders them as on-screen text — see VIDEO_PROMPTS.md>
<Motion pace, and what must loop seamlessly>
<Negatives: no on-screen text, no colour codes or hex values, no lettering, no UI chrome, no logos, no recognisable faces, no watermarks>
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

Then one line telling the operator to drop the download in `./videos_new/` and notify you.

The prompt must be derived from this site's own niche, palette and placement slot. A generic "cinematic industrial b-roll" prompt is a failed handoff.

**Response tail order** — when the image-generation quota was also hit (§15), the order is: build summary → `VIDEO GENERATION PROMPT` block → bold quota block absolutely last.

### 11d. When the operator delivers the file

```
npm run optimize:video -- --slug <slug> --slot "<placement>"
```

It picks up the newest file in `./videos_new/`, encodes VP9 (2-pass, ≤720p, no audio, ≤2.5 MB) plus an H.264 mp4 fallback and a WebP poster, writes them to the site's `assets/` as `<slug>-<slot>.*`, updates `meta.video` / `meta.videoPlacement`, and prints the markup to paste. Requires ffmpeg on PATH.

Then wire it in, re-run QA, and re-run the Extreme Visual Audit — the video is the single most likely thing to break legibility.

## 12. Asset isolation (mandatory)

Assets are **site-private**.

- Never copy, move, symlink, or reference an image or video from another site folder.
- Never reuse a generated asset across sites. Regenerate or re-source it.
- Never hotlink remote media. Everything lives in the site's own `assets/`.
- Every asset filename must describe its own subject and be unique repo-wide. Generic names (`hero`, `image1`, `photo`, `temp*`) are rejected.

Enforced by `npm run check:assets -- <slug>`, which hashes every asset repo-wide and fails on cross-site duplicates, out-of-folder references, and hotlinks. It runs inside `npm run check:ship`.

## 13. Motion budget (mandatory)

Every site ships real motion. Minimum, all of it:

- **One IntersectionObserver scroll-reveal system** — staggered, fires once, never re-triggers.
- **The rolled signature effect** from `scripts/lib/signature-effects.js`, implemented per its spec in `SIGNATURE_EFFECT_SPECS` and recorded in `meta.signatureEffect`.
- **The layout family's signature motion** from the brief.
- **2–3 supporting motion ideas** and **2 micro-interactions** (`:hover` + `:focus-visible` + `:active`).
- All transitions **120–400ms** with a custom `cubic-bezier` — never a bare `ease`.
- Animate **`transform` and `opacity` only**. Never animate `width`, `height`, `top`, `left`, or anything else that triggers layout.
- A **`@media (prefers-reduced-motion: reduce)`** block that neutralises all of it, including pausing or hiding the video loop. Non-negotiable.
- Nothing that animates on load may delay LCP.

`npm run check:contract` fails a build with no `IntersectionObserver`, no `prefers-reduced-motion` handling, or no CSS transitions/animations.

## 14. Extreme Visual Audit (mandatory, and now enforced)

The correctness sweep (`npm run qa`) does not see UI/UX or legibility problems. This step does. Do not set `qa: "v2-pass"` until it is complete.

This used to be an honour system and it did not hold. `check:ship` never read the visual report, a site with zero screenshots reached `SHIP_PASS`, and the instruction to "watch the walkthrough recording" asked the agent to open a `.webm` it cannot read. It is now a hash-bound gate: `npm run check:ship` fails until `npm run check:vision` passes.

1. `npm run build` → `npm run qa -- <slug>` → `npm run qa:visual -- <slug>`.
2. `qa:visual` renders **ten devices** (`scripts/lib/device-matrix.js`) with real touch, device pixel ratio and user agent, then composites the tiles into **contact sheets** under `qa-screenshots/<slug>/sheets/`.
3. **Look at every sheet listed in `qa-screenshots/<slug>/INDEX.md`.** All of them, not a sample. There are three kinds:
   - `wall-*.png` — every device's full page side by side. Read this first: overflow, uncollapsed grids and oversized media show up here at a glance.
   - `detail-*.png` — tiles at a legible cell width for the phones, tablet and desktop. Read the copy: legibility, contrast, spacing, clipping.
   - `walkthrough-*.png` — frames pulled from the recording: layout shift during scroll, animations firing late/never/repeatedly, sticky elements colliding, dead hover states, video showing a black first frame.
   - `detail-*-reduced-motion-*.png` — the page rendered under `prefers-reduced-motion: reduce`. Confirm content is actually *there*: these sites hide reveals at `opacity: 0` and show them with JS, so a missing or out-specified reduce branch leaves the page blank.
   - `detail-*-interaction-*.png` — the keyboard walk and the opened overlay. Confirm each focus ring is visible, and that the dialog traps focus and returns it to the trigger on Escape.
4. Read `qa-visual-report.json` for the per-device heuristic findings. Blocker-class findings fail `qa:visual` outright and are re-checked by `check:ship`; advisory ones are yours to judge and belong in the review. The heuristics finding nothing does **not** substitute for looking.
5. **Fix what you find, then re-run.** Re-running regenerates the sheets and invalidates any existing review, which is intended.
6. Record the review in `audit/visual-reviews/<slug>.md`. Start it with:

   ```
   node scripts/check-vision-review.js <slug> --write-stub
   ```

   Fill in what you saw per sheet, set `sheetsReviewed` to `N/N` and `verdict: PASS`, then:

   ```
   npm run check:vision -- <slug>
   ```

   It fails if the review is missing, incomplete, not `PASS`, or **stale** — the `digest` binds the review to the site source plus every sheet byte, so a review cannot outlive what it approved.
7. Write a `## Visual Audit` section into the build summary listing each issue found **and the fix applied**. "No issues found" is only acceptable when accompanied by the number of sheets you actually reviewed.

**Browser fallback** — if `qa:visual` cannot run in your environment, do the same work manually with your browser tooling: load the preview at each device size in the matrix, screenshot in viewport-height steps from top to bottom, walk every link and every hover state, and report against the same checklist. Say in the summary that you used the fallback.

## 15. Image generation quota

If image-generation quota, rate limits, or credits are exhausted at any point:

1. Finish everything else that does not depend on the missing assets.
2. Exhaust the PD/open-photo route (ladder step 1) for whatever remains.
3. **Do not set `qa: "v2-pass"`** while any asset is a placeholder. `picsum`/random placeholders remain a hard failure.
4. End your response — **after** the video prompt block, absolutely last — with:

```
**IMAGE GENERATION QUOTA REACHED**

Missing assets:
- assets/<name>.webp — <subject brief>

Resume with: <exact commands to re-run once quota resets>
```

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
| Optimize + install video              | `npm run optimize:video -- --slug <slug> --slot "<placement>"` |
| Puppeteer QA sweep (10 devices)       | `npm run qa` (`-- <slug>`; `--devices core\|fast\|<keys>`) |
| Visual QA (tiles + sheets + walkthrough) | `npm run qa:visual -- <slug>` (`--devices`, `--no-sheets`) |
| Visual review gate                    | `npm run check:vision -- <slug>`                        |
| Static site contract                  | `npm run check:contract -- <slug\|--all>`               |
| Asset isolation                       | `npm run check:assets -- <slug\|--all>`                 |
| Ship gate (copy + contract + assets + report) | `npm run check:ship -- <slug> [--floor N]`      |
| Regenerate sites index (Gemini paste) | `npm run sites:index`                                   |
| Copy depth check                      | `npm run check:copy-depth -- <slug> [floor]`            |
| Code Quality: Lint                    | `npm run lint`                                          |
| Code Quality: Format                  | `npm run format`                                        |

`npm run qa` starts preview against the built `dist/` — always `npm run build` first. QA fails on overflow, broken images, non-WebP photos (img + CSS), missing alt, console/network errors, broken internal links, or `<video>` contract violations (missing muted/loop/playsinline/poster/preload, no webm source, never reaching `readyState 2`). Report shape: `{ summary, pages }` in `qa-report.json`.

`npm run qa` renders every page on the ten devices in `scripts/lib/device-matrix.js`, navigating afresh for each one. It used to test two viewports and switch between them with `setViewport()` on a live page, so "mobile" was measured against JS that had initialised at 1440px — that is how a site with two 1024px images and no `max-width` rule passed at 390px.

`npm run qa:visual` is a separate, deeper pass — viewport tiles on every device, contact sheets, a walkthrough recording, `qa-visual-report.json`, `MANIFEST.json`, and the `INDEX.md` list you are held to reviewing. It fails if it produced no evidence, and `check:vision` fails until you have reviewed what it produced; see §14.

**ffmpeg is required** on PATH for `optimize:video` and for the `qa:visual` walkthrough recording. Without it, `optimize:video` fails with instructions and `qa:visual` continues with a warning and no recording.

## Hub contract

See @.agents/rules/01-site-v2-standard.md (hub integration + meta schema + paths).

## Off-limits

See @.agents/rules/03-repo-safety.md.

## Optional recovery workflows

Primary path is brief auto-detect. Slash workflows exist only for recovery:

- `/qa-sweep` — rebuild + QA + interpret `qa-report.json`
- `/optimize-assets` — WebP + HTML optimize for a slug or all
- `/upgrade-site-v2` — legacy recovery only: flatten a nested Vite site to v2 (current tree is already flat)
