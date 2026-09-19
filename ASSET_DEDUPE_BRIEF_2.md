# Asset dedupe — closing the last 5 duplicates

You are working in `C:\Users\Dr0sera\Github\illegal-automation`, a Vite multi-page
static-site hub. Every site lives in `sites/<YYYY-MM>/<slug>/` with its own
`assets/` folder, and the repo enforces **asset isolation**: no two sites may ship
byte-identical imagery. `npm run check:assets -- --all` does SHA-256 comparison
across all 88 sites and currently reports **10 findings**.

Those 10 are 5 reciprocal pairs — each duplicate is reported once from each side —
so **there are 5 distinct groups and you need to generate exactly 5 images.**
Two of them are currently hard `ASSETS_FAIL`.

---

## The rule that decides which side regenerates

**The older site keeps the image; the newer site regenerates.** Site age is
`meta.created` in each site's `meta.json`. This is already resolved for you below —
do not re-derive it, and do not touch the "keeps it" side.

| # | Keeps it (do not touch) | Regenerate this file | Status |
|---|---|---|---|
| 1 | `abyssal-hardware` (2026-05-29) | `uhv-74-precision/assets/hero-vacuum-chamber-cleanroom.webp` | ASSETS_FAIL |
| 2 | `archive-arcade` (2026-06-02) | `uhv-74-precision/assets/five-axis-cnc-diamond-milling.webp` | ASSETS_FAIL |
| 3 | `ash-07-studio` (2026-09-01) | `the-sub-oolite-salt-cellar/assets/telemetry-salinometer-bench.webp` | warn |
| 4 | `ash-07-studio` (2026-09-01) | `the-sub-oolite-salt-cellar/assets/hero-salt-mine-gallery.webp` | warn |
| 5 | `ash-07-studio` (2026-09-01) | `the-sub-oolite-salt-cellar/assets/product-halite-slab.webp` | warn |

So: **2 images for `uhv-74-precision`, 3 for `the-sub-oolite-salt-cellar`.**

---

## Part 1 — Generate the 5 replacements

Each replacement must depict **what its filename and alt text already claim**, in
the receiving site's own visual language. The alt text is the specification — the
new image has to make the existing alt true. Keep the same filename and the same
pixel dimensions so nothing else in the repo needs touching.

### uhv-74-precision — ultra-high vacuum chambers

Monolithic UHV vessels machined to sub-micron tolerances for particle physics.
Palette: `--color-primary: hsl(215,24%,16%)`, `--color-secondary: hsl(25,75%,44%)`,
`--color-accent: hsl(188,92%,46%)`, `--color-bg: hsl(210,15%,93%)`.
Register: clinical, precise, cold metal under cleanroom light.

**1. `hero-vacuum-chamber-cleanroom.webp` — 1024×1024**
Alt that must become true:
> "An electropolished 8-port spherical octagonal vacuum chamber inside the Harwell cleanroom."

Generate: a mirror-finish stainless spherical octagon chamber with eight CF flanges,
standing on a frame in a white cleanroom bay, blue-white overhead light, faint
reflections of the room in the electropolished surface. No people, no text, no logos.

**2. `five-axis-cnc-diamond-milling.webp` — 1024×1024**
This one has **no alt text** — it is used as a CSS `background-image` behind
masked display type (`.masked-band__type`, `style.css:583`), so it is seen only
through cut-out letterforms.

Generate: extreme close-up of a five-axis CNC diamond tool cutting stainless, bright
chip curl and coolant spray, hard specular highlights. **Favour strong local
contrast and busy detail over a legible wide subject** — it is only ever glimpsed
through letter shapes. No people, no text, no logos.

### the-sub-oolite-salt-cellar — Triassic halite curing vaults

Deep-mine dry-curing in Cheshire halite, engineered with Royal Navy cold-store
practice. Palette: `--color-primary: hsl(215,28%,16%)`,
`--color-secondary: hsl(22,34%,30%)`, `--color-accent: hsl(14,88%,52%)`,
`--color-bg: hsl(210,12%,94%)`.
Register: geological, cold, industrial-food-safe.

**3. `telemetry-salinometer-bench.webp` — 1024×1024**
> "Food safety laboratory bench testing water activity and salt penetration in meat samples."

Generate: a stainless lab bench with a water-activity meter and salinometer, sample
dishes of cured meat under clinical light, probes and a logging readout. No people,
no text, no logos.

**4. `hero-salt-mine-gallery.webp` — 1376×768** (note: NOT square)
> "Vast subterranean salt mine gallery carved from solid halite."

Generate: a cathedral-scale mined gallery cut from banded halite, tool marks raking
across the walls, lights receding down the tunnel, sense of enormous scale. No
people, no text, no logos.

**5. `product-halite-slab.webp` — 1024×1024**
> "Mark VIII diamond-sawn halite curing block on a stainless steel inspection bench."

Generate: a single rectangular diamond-sawn salt block, translucent pink-grey with
visible bedding layers and saw striations, on a brushed stainless bench under even
light. No people, no text, no logos.

---

## Part 2 — Install them

For each generated image:

1. Save as **WebP**, at the **exact dimensions listed** and the **exact existing
   filename**, over the file in that site's `assets/` folder.
2. Keep file size in the same range as the original (68–300 KB; see the table
   above). These are content images, not heroes — do not ship multi-megabyte files.
3. Do **not** rename anything, do **not** edit any HTML or CSS, and do **not**
   touch the "keeps it" sites. Every reference already points at these filenames;
   replacing the bytes is the whole change.

---

## Part 3 — Verify

Run these from the repo root and paste the output back:

```bash
npm run check:assets -- --all
npm run build
npm run qa -- uhv-74-precision
npm run qa -- the-sub-oolite-salt-cellar
```

**Definition of done:**

- `check:assets --all` reports **0 duplicate findings** (it currently reports 10).
  In particular `uhv-74-precision`, `the-sub-oolite-salt-cellar`, `archive-arcade`
  and `abyssal-hardware` must all report `ASSETS_PASS` — the last two fail today
  only because of their counterpart, so they clear automatically.
- `npm run build` succeeds.
- `npm run qa` on both touched sites reports `QA PASS`, with `brokenImages: 0` and
  `nonWebpPhotos: 0`.

If a generated image cannot be made to match its alt text honestly, say so and stop
rather than shipping an image the alt misdescribes — the alt text is load-bearing
for screen-reader users and several of these strings are checked elsewhere in the
repo.

---

## Context you may want

- `audit/REMEDIATION.md` — per-site campaign status.
- `AGENTS.md` §12 — the asset isolation rule.
- `scripts/check-asset-isolation.js` — the checker itself.
- The previous dedupe round is described in `ASSET_DEDUPE_BRIEF.md`; this is the
  remainder that was not completed when that run hit its quota.
