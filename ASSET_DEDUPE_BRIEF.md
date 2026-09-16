# Asset dedupe brief — cross-site duplicate imagery

A one-off remediation pass. Hand this whole file to the build agent.

---

## The problem

`npm run check:assets` hashes every asset repo-wide and fails on byte-identical
files shared between sites. Right now **22 image groups are shared across 12
sites**. Asset isolation (`AGENTS.md` §12) is absolute:

> Assets are site-private. Never reuse a generated asset across sites.
> Regenerate or re-source it. Every asset filename must describe its own
> subject and be unique repo-wide.

The audit reports **44 findings**, but that number double-counts: every
duplicate is reported from both sides of the pair. There are **22 distinct
groups**, and only one file per group actually has to change.

## The rule for deciding which file changes

**The oldest site keeps the image; every newer site gets new imagery.** Creation
date comes from `meta.created`. This is already applied below — do not re-derive
it, just work the lists.

## Scope: 23 files, and 6 of them need no image at all

| Action | Files | Why |
|---|---|---|
| **Delete** | 6 | Orphaned — the duplicate is not referenced by any HTML, CSS or JS |
| **Regenerate** | 17 | Genuinely in use on the page |

Deleting the orphans first is not optional housekeeping — it removes a quarter of
the work before a single image is generated, and those six are also currently
firing `orphan asset` warnings of their own.

---

## Part 1 — Delete these 6 (no generation)

Each is a byte-identical duplicate **and** referenced nowhere in its site.
Delete the file, then confirm nothing referenced it.

```
sites/2026-08/uhv-74-precision/assets/beamline-vacuum-installation.webp
sites/2026-08/uhv-74-precision/assets/conflat-knife-edge-macro.webp
sites/2026-08/uhv-74-precision/assets/harwell-workshop-metrology.webp
sites/2026-08/uhv-74-precision/assets/helium-leak-detector-bench.webp
sites/2026-09/tracemend/assets/process-beeswax-dip.webp
sites/2026-07/siloshield-dynamics/assets/icons.svg
```

Verify each with `grep -r "<filename>" sites/<month>/<slug>/` before deleting —
if a reference turns up, move it to the regenerate list instead of deleting.

While you are in `tracemend` and `siloshield-dynamics`, note they carry other
orphans (`product-pelton-turbine.webp`, `product-ridge-node-slate.webp`) that are
**not** duplicates. Leave those alone; they are out of scope for this pass.

---

## Part 2 — Regenerate these 17

For each: generate a new image, save it as WebP at the **existing filename and
path**, and leave the markup untouched. The filenames are already correct and
descriptive — this pass is about the pixels, not the wiring.

### House rules for every image

- **Format:** WebP. Run `npm run optimize:webp -- --slug <slug>` after dropping
  files in, or export WebP directly.
- **Dimensions:** match the `width`/`height` already declared on the `<img>` tag
  for that file. Most are `1024x1024`; some are `1200x896` or `1376x768`. Read
  the tag, do not assume.
- **Weight:** aim ≤200KB. The existing files sit between 100KB and 190KB.
- **Content must match the existing `alt` text**, which is quoted below for each
  file. The alt text is the spec — if the new image would not be described by
  that sentence, the image is wrong.
- **No text, no logos, no recognisable faces, no watermarks** in any image.
- **Each image must be unique repo-wide.** Do not generate variations of one
  scene and spread them across sites — that is the bug being fixed.

---

### ash-07-studio — 2 files
`sites/2026-09/ash-07-studio/`
**Brand:** hand-thrown Welsh stoneware, clay aged sixty metres underground,
wood-fired with raw volcanic basalt ash.
**Palette:** near-black slate `hsl(215,24%,15%)`, moss green `hsl(100,20%,36%)`,
amber accent `hsl(36,92%,48%)`, warm off-white ground `hsl(40,14%,93%)`.

| File | Must depict (current alt) |
|---|---|
| `blaenau-slate-mine-exterior.webp` | The historic slate quarry landscape surrounding Chamber 7 at Blaenau Ffestiniog. |
| `macro-ash-glaze-chawan.webp` | Macro photograph of natural wood-ash glaze pooling over coarse stoneware clay. |

> Shoot the quarry as a wide, wet, grey-green Welsh landscape with terraced slate
> spoil — not a generic cave mouth. The chawan macro wants shallow depth of
> field on the glaze pool where it breaks over the clay body.

### centrifugal-larder — 3 files
`sites/2026-07/centrifugal-larder/`
**Brand:** high-G culinary extraction and clarification.
**Palette:** deep navy `#0f172a`, slate `#1e293b`, amber distillate `#f59e0b`,
near-white type `#f8fafc`.

| File | Must depict (current alt) |
|---|---|
| `hero-centrifuge.webp` | Centrifugal extraction laboratory equipment isolating clear culinary liquids. |
| `bento-clarity.webp` | Optically flawless liquid isolate demonstrating 0.2-micron filtration. |
| `isolate-bottles.webp` | Pharmaceutical amber bottles containing pure culinary flavor isolates. |

> This is a **kitchen-laboratory**, not a hospital. Keep the amber distillate as
> the one warm note against cold navy-slate equipment.

### forge-and-fallow — 6 files
`sites/2026-08/forge-and-fallow/`
**Brand:** intertidal horseshoeing and salt-marsh harness ironmongery, forged on
mobile amphibious anvil skiffs during the four-hour low-water spring tide window,
Morecambe Bay.
**Palette:** deep navy `hsl(212,28%,18%)`, chestnut `hsl(28,42%,28%)`, hot orange
accent `hsl(24,95%,48%)`, sand ground `hsl(42,18%,94%)`.

| File | Must depict (current alt) |
|---|---|
| `hero-intertidal-forge.webp` | Mobile tracked forge shoeing a draft horse on the Morecambe Bay sandflats at low tide |
| `flagship-hot-fitting.webp` | Hot-fitting a glowing wide-web horseshoe to a draft horse hoof with steam rising |
| `product-tracked-tender.webp` | Tracked amphibious forge tender parked on the low-water sand flats |
| `bento-cartmel-shoe.webp` | Cartmel wide-web draft horseshoe with tungsten cleats resting on wet sand |
| `bento-harness-hardware.webp` | Heavy marine stainless steel and bronze draft harness hardware on weathered wood |
| `bento-tungsten-cleats.webp` | Machined tungsten carbide screw-in studs for mud traction on a leather apron |

> The three `bento-*` images are grid cells shown together — give them a shared
> light and surface treatment so the row reads as one set, while staying three
> distinct subjects. Wet sand, low flat estuary light, no sun.

### the-sub-oolite-salt-cellar — 4 files
`sites/2026-09/the-sub-oolite-salt-cellar/`
**Brand:** Triassic halite blocks and deep-mine dry-curing vaults, built with
Cheshire brine-miners and Royal Navy cold-stores officers.
**Palette:** near-black `hsl(215,28%,16%)`, rust brown `hsl(22,34%,30%)`,
red-orange accent `hsl(14,88%,52%)`, cool grey ground `hsl(210,12%,94%)`.

| File | Must depict (current alt) |
|---|---|
| `hero-salt-mine-gallery.webp` | *(no alt set — add one)* A worked gallery deep in a Cheshire rock-salt mine, banded Triassic halite walls under work lighting. |
| `process-diamond-saw.webp` | Industrial diamond saw cutting a raw halite boulder with water-cooled brine spray. |
| `product-halite-slab.webp` | Mark VIII diamond-sawn halite curing block on a stainless steel inspection bench. |
| `telemetry-salinometer-bench.webp` | Food safety laboratory bench testing water activity and salt penetration in meat samples. |

> `process-diamond-saw.webp` and `telemetry-salinometer-bench.webp` are currently
> **the same file as each other as well** — they must end up as two clearly
> different scenes (a wet cutting floor vs. a clean instrument bench).
> `hero-salt-mine-gallery.webp` has no `alt` attribute at all: add the sentence
> above to its `<img>` tag as part of this work.

### uhv-74-precision — 2 files
`sites/2026-08/uhv-74-precision/`
**Brand:** monolithic ultra-high vacuum vessels machined to sub-micron tolerances
for particle physics research, Harwell.
**Palette:** near-black `hsl(215,24%,16%)`, copper `hsl(25,75%,44%)`, cyan accent
`hsl(188,92%,46%)`, cool grey ground `hsl(210,15%,93%)`.

| File | Must depict (current alt) | Referenced from |
|---|---|---|
| `hero-vacuum-chamber-cleanroom.webp` | An electropolished 8-port spherical octagonal vacuum chamber inside the Harwell cleanroom. | `index.html` |
| `five-axis-cnc-diamond-milling.webp` | *(no alt — used as a CSS background)* Five-axis CNC diamond milling of a stainless vacuum flange, coolant flooding the cut. | `style.css` |

> `five-axis-cnc-diamond-milling.webp` is the fill behind the masked-type band,
> so it needs **texture across the whole frame and no single focal point** — the
> letters crop it hard. Avoid a centred hero subject there.

---

## Part 3 — Implementation steps

1. **Delete the six orphans** (Part 1), confirming each is unreferenced first.
2. **Generate the seventeen images** (Part 2) at the declared dimensions.
3. Save each at its **existing path and filename**. Do not rename; the markup,
   `meta.json` and CSS already point at these names.
4. Add the missing `alt` text on `the-sub-oolite-salt-cellar/hero-salt-mine-gallery.webp`
   and confirm every other `<img>` still carries alt text that matches its new image.
5. `npm run optimize:webp -- --slug <slug>` for each touched site.
6. `npm run build`

## Part 4 — Verification (all must pass)

Per touched site — `ash-07-studio`, `centrifugal-larder`, `forge-and-fallow`,
`the-sub-oolite-salt-cellar`, `uhv-74-precision`, `tracemend`, `siloshield-dynamics`:

```bash
npm run check:assets -- <slug>     # expect ASSETS_PASS, no duplicate and no orphan lines
npm run check:contract -- <slug>   # expect CONTRACT_PASS
npm run qa -- <slug>               # expect QA PASS — catches broken images
npm run qa:visual -- <slug>        # review the tiles; expect 0 heuristic findings
```

Then repo-wide:

```bash
npm run check:assets -- --all      # expect 0 cross-site duplicates
npm run status -- --write          # regenerate audit/REMEDIATION.md
```

The dedupe worklist section of `audit/REMEDIATION.md` must come back **empty**.

## Part 5 — What "done" looks like

- `check:assets --all` reports no cross-site duplicates and no new orphans.
- The seven touched sites still pass contract, QA and visual QA.
- No site's layout, copy, or markup changed beyond the one added `alt` attribute
  — this pass replaces pixels, nothing else.
- `audit/REMEDIATION.md` has no entries under the deferred dedupe worklist.

## Quota

Seventeen images. If the image-generation quota is reached partway, **stop and
report which files are still on the old asset** — do not leave a site half-done
with a broken or missing image, and do not substitute an image from another site
to fill a gap. Per `AGENTS.md` §15, the quota notice is the last thing in the
response, in bold.
