# Video generation queue

Prompts for clips the remediation campaign still needs. Generate each in Google
Flow, download it, drop it in `./videos_new/`, and tell the agent which site it
belongs to — or just say "the videos are in" if the whole batch is there.

The agent then runs:

```bash
npm run optimize:video -- --slug <slug> --slot "<placement>"
```

which encodes VP9 + an H.264 fallback + a poster frame, installs them into the
site's `assets/`, updates `meta.json`, and wires the markup into the slot.

**Every prompt is written for one specific brand.** The placement slot, palette
and subject all come from that site's own copy — they are not interchangeable.

**Coverage: 42 of 88 sites have their clip installed.** Twelve more (batch 6) are
prepped and awaiting their clip; the remaining 34 have not been through
remediation yet.

---

## Pending — batch 6 (12 clips)

Twelve sites are prepped and passing every static gate; each is waiting on its
clip. The slots are live now with a still in place, so the pages are complete and
correct without video — the clip replaces the still when it lands.

Download each into `./videos_new/` and say "the videos are in". The table maps the
expected files to their slugs:

| # | Save as | Slug | Placement |
|---|---|---|---|
| 1 | `kajak-lauget.mp4` | kajak-lauget | footer ambient |
| 2 | `nadir-quartzware.mp4` | nadir-quartzware | grid tile |
| 3 | `glaciermesh-infrastructure.mp4` | glaciermesh-infrastructure | modal feature |
| 4 | `pellucid-memory.mp4` | pellucid-memory | inline process demo |
| 5 | `isocline-preservation.mp4` | isocline-preservation | split panel |
| 6 | `monolith-somatic.mp4` | monolith-somatic | hero background |
| 7 | `centrifugal-larder.mp4` | centrifugal-larder | hero inset frame |
| 8 | `gimbal-and-hoist.mp4` | gimbal-and-hoist | hover reveal |
| 9 | `katabatic-shelters.mp4` | katabatic-shelters | sticky rail loop |
| 10 | `78-north-supply.mp4` | 78-north-supply | footer ambient |
| 11 | `kestrel-heavy.mp4` | kestrel-heavy | masked type fill |
| 12 | `apiary-mesh-kinetics.mp4` | apiary-mesh-kinetics | marquee strip |

### 1. kajak-lauget — footer ambient

- **Site:** `sites/2026-08/kajak-lauget/`
- **Target file:** `assets/kajak-lauget-footer-ambient.webm`
- **Where it lands:** full-width band across the footer, behind the closing contact block under a heavy scrim
- **Brand:** traditional skin-on-frame sea kayaks under eighteen kilograms, kept in keycard-locked boathouse vaults on the Outer Hebrides archipelago

```text
Interior of a stone boathouse on a Hebridean shore: skin-on-frame sea kayaks racked in
rows on timber cradles, translucent hulls lit from behind by a low doorway, dust and sea
haze hanging in the light shaft, water reflections rippling across the ceiling beams.
Camera: 35mm, extremely slow lateral drift past the racked hulls, locked horizon.
Lighting: single cool daylight source from the seaward door, deep shadow in the rack bays.
Palette: deep teal hsl(188,65%,32%), warm timber browns hsl(30,15%,28%), one gold
highlight hsl(42,85%,52%) where the light catches a gunwale.
Motion: reflected water light and drifting haze only - the boats are static. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 2. nadir-quartzware — grid tile

- **Site:** `sites/2026-08/nadir-quartzware/`
- **Target file:** `assets/nadir-quartzware-grid-tile.webm`
- **Where it lands:** one tile of the specification grid, sized as a 16:9 cell beside the readout panels
- **Brand:** direct-to-laboratory catalogue of synthetic fused-silica optical cuvettes, micro-bore flow cells and spectroscopic calibration standards

```text
Macro shot of a fused-silica high-pressure flow cell on a black anodised optical bench:
a thin cyan laser beam entering the polished quartz window, refracting through the bore and
exiting as a clean line, faint scatter in the fluid path, the cell body absolutely still.
Camera: 100mm macro, locked-off, no camera move.
Lighting: dark bench, one hard raking key from the left, the beam as the only bright element.
Palette: near-black hsl(215,22%,10%), brushed steel greys, electric cyan hsl(185,90%,45%),
one amber indicator hsl(38,95%,50%) out of focus at the frame edge.
Motion: only the beam intensity breathing and slow scatter in the fluid. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 3. glaciermesh-infrastructure — modal feature

- **Site:** `sites/2026-07/glaciermesh-infrastructure/`
- **Target file:** `assets/glaciermesh-infrastructure-modal-feature.webm`
- **Where it lands:** inside the film dialog the bento poster tile opens — the largest the clip is ever shown, so it carries the most detail of the twelve
- **Brand:** titanium edge-server chassis engineered to run continuously on Antarctic ice shelves where diesel generators freeze and enterprise silicon fractures

```text
Antarctic field outpost at polar twilight: a squat titanium server chassis half-buried in
drift snow, status LEDs pulsing through a crust of rime, spindrift streaming across the ice
in a low ground wind, a dark ridge line on the horizon.
Camera: 24mm, very slow push-in on the chassis, horizon locked and level.
Lighting: blue polar dusk ambient; the LED glow and one cold white floodlight are the only
warm-side sources.
Palette: glacial blues hsl(205,85%,42%), slate hsl(215,20%,25%), white ice, a single orange
status indicator hsl(28,95%,52%).
Motion: streaming spindrift and pulsing indicators only - the chassis never moves. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 4. pellucid-memory — inline process demo

- **Site:** `sites/2026-07/pellucid-memory/`
- **Target file:** `assets/pellucid-memory-inline-process-demo.webm`
- **Where it lands:** the process demo frame in the archival workflow section, at rest on its poster and played as the step it illustrates
- **Brand:** permanent data archival written as voxel layers into synthetic quartz plates, rated for geological timescales

```text
Femtosecond laser writing into a synthetic quartz plate: the beam stepping across the
plate in a tight raster, each pass leaving a faint lattice of voxel dots that catch the light,
the plate held in a precision stage on a dark optical table.
Camera: 60mm macro, slight high angle, locked-off with one slow micro-dolly right.
Lighting: darkened lab, the write beam and one soft cold fill; the quartz edge-glows.
Palette: clean off-white highlights on near-black, cobalt blue #0047ab beam scatter,
neutral greys #e9ecef.
Motion: the raster step and the growing voxel lattice. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 5. isocline-preservation — split panel

- **Site:** `sites/2026-07/isocline-preservation/`
- **Target file:** `assets/isocline-preservation-split-panel.webm`
- **Where it lands:** the media half of the "Held in the strata" split band, paired with the lead copy
- **Brand:** deep-strata clinical storage and non-invasive restoration for volatile contemporary art, 150 metres below the Cheshire salt field

```text
Deep salt-mine art vault: crated works racked on white powder-coated storage frames in a
chamber cut from pale salt rock, the crystalline walls throwing back a soft matte sheen, a
conservator's task light casting a slow-moving pool across the rack face.
Camera: 40mm, very slow track along the rack line, level and steady.
Lighting: clinical cool white from recessed fittings, deep quiet shadow beyond the racks.
Palette: near-white #fdfdfd, pale salt greys #f0f2f5, sage-grey #8c9b93 accents.
Motion: the travelling light pool and faint dust only - everything else is still. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 6. monolith-somatic — hero background

- **Site:** `sites/2026-07/monolith-somatic/`
- **Target file:** `assets/monolith-somatic-hero-background.webm`
- **Where it lands:** full-bleed behind the "Inside the chamber" band, under an engineered scrim sized for a moving image
- **Brand:** clinical silence and nervous-system stabilisation delivered into the loudest industrial environments on earth
- **Note:** the slot's scrim carries a 0.4 base opacity, so the headline holds against the clip's brightest frame.

```text
Interior of an anechoic chamber: dense grey wedge foam covering every wall, floor and
ceiling in receding rows, a single suspended grating walkway down the centre, the geometry
swallowing all light at depth.
Camera: 28mm, slow push down the chamber axis, dead-centre and symmetrical.
Lighting: one cool overhead source above the walkway, falling off to black in the wedge field.
Palette: neutral greys #ebebeb through #d4d4d4 to near-black, one deep blue #1a4f8a
instrument glow at the far end.
Motion: the push-in only - the chamber is utterly static, which is the point. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 7. centrifugal-larder — hero inset frame

- **Site:** `sites/2026-07/centrifugal-larder/`
- **Target file:** `assets/centrifugal-larder-hero-inset-frame.webm`
- **Where it lands:** the inset frame above the catalogue, revealed by a scroll-driven clip-path wipe
- **Brand:** high-G culinary extraction and clarification - stocks and isolates spun clear in laboratory centrifuges

```text
Laboratory extraction bench: brilliantly clear amber stock drawing off a centrifuge
decant spout into a chilled stainless beaker in a single unbroken thread, the spent puck
visible in the rotor bowl behind, condensation beading on the vessel.
Camera: 85mm, locked-off medium close-up, no camera move - the motion is all in the liquid.
Lighting: dark bench, one hard side key raking the liquid thread so it reads as glass.
Palette: deep navy-black #0f172a, slate #1e293b, brushed steel, distillate amber #f59e0b
in the liquid itself.
Motion: continuous unbroken pour. Must loop seamlessly with no cut.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 8. gimbal-and-hoist — hover reveal

- **Site:** `sites/2026-07/gimbal-and-hoist/`
- **Target file:** `assets/gimbal-and-hoist-hover-reveal.webm`
- **Where it lands:** behind the "Under Load" card - poster at rest, clip on hover and keyboard focus, and it plays its pass out rather than cutting when the pointer leaves
- **Brand:** high-angle maintenance rigging for offshore work taken on from the heavy swell

```text
Quayside rigging block under working load: a steel sheave turning slowly as wet
synthetic rope runs through it, water flinging off the line in fine droplets, the block
body swinging a few degrees against a grey offshore sky.
Camera: 70mm, locked-off tight on the block, the rope running through frame.
Lighting: flat overcast marine daylight, one cold specular on the wet steel.
Palette: charcoal #1f2426 and #2d3538, wet galvanised steel, safety amber #f2a900 on the
block cheek.
Motion: the sheave rotation, rope travel and droplet throw. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 9. katabatic-shelters — sticky rail loop

- **Site:** `sites/2026-07/katabatic-shelters/`
- **Target file:** `assets/katabatic-shelters-sticky-rail-loop.webm`
- **Where it lands:** the sticky rail beside the specification hub - on screen for that whole section's scroll, so it has to stay quiet enough to sit next to reading
- **Brand:** extreme-latitude shelters and polar bivouacs guyed to hold against katabatic fall winds

```text
Polar field camp in a fall wind: a low orange geodesic shelter pitched and guyed on a
windswept snow plain, guy lines humming taut, snow streaming past the shell in long low
ribbons, a flat white horizon behind.
Camera: 50mm, locked-off wide-medium, no camera move.
Lighting: flat high-latitude overcast, shadowless, a faint blue cast in the snow hollows.
Palette: pale blue-white snow #f0f4f8 and #e2e8f0, slate sky, the shelter in hot
orange #ff4d00.
Motion: streaming snow and taut vibrating guy lines only. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 10. 78-north-supply — footer ambient

- **Site:** `sites/2026-07/78-north-supply/`
- **Target file:** `assets/78-north-supply-footer-ambient.webm`
- **Where it lands:** full-width band across the footer, behind the dispatch details under a heavy scrim
- **Brand:** expedition gear dispatched from Longyearbyen at 78°13′ north

```text
Arctic depot yard at blue hour: stacked orange expedition supply crates under a
snow-dusted loading canopy, a single sodium lamp overhead, fine snow falling through the
light cone, dark mountain mass behind the yard.
Camera: 35mm, imperceptibly slow drift left, horizon locked.
Lighting: deep blue polar dusk ambient with one warm sodium pool on the crate stack.
Palette: near-black blue #1a1f26, cold off-white snow #f4f6f9, dispatch orange #ff5a1f
on the crates.
Motion: falling snow only - the yard is still. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 11. kestrel-heavy — masked type fill

- **Site:** `sites/2026-07/kestrel-heavy/`
- **Target file:** `assets/kestrel-heavy-masked-type-fill.webm`
- **Where it lands:** visible only through the numerals "40 t" in the machine-class band, via the layered SVG knockout
- **Brand:** heavy plant parts for machines flown to the ridge in sections and rebuilt on site
- **Note:** the clip is seen only through the letterforms, so favour strong local contrast and movement over a legible wide subject.

```text
Extreme macro on the carbide cutting teeth of a heavy rock-cutting drum: the teeth
passing through frame as the drum turns, rock dust streaming off the carbide tips, scored
steel and bright wear-polish on each insert.
Camera: 100mm macro, locked-off, the drum rotating through frame.
Lighting: hard low sun raking across the teeth so the carbide flares, deep shadow behind.
Palette: near-white dust haze #fcfcfc, grey rock #f2f2f2, dark steel, aviation
orange #e64a19 on the drum housing.
Motion: continuous drum rotation and dust stream - high contrast and busy, which is what
reads well through cut-out numerals. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 12. apiary-mesh-kinetics — marquee strip

- **Site:** `sites/2026-07/apiary-mesh-kinetics/`
- **Target file:** `assets/apiary-mesh-kinetics-marquee-strip.webm`
- **Where it lands:** riding the drifting band above the topology section alongside the telemetry slogans - it appears twice, in both identical halves of the loop
- **Brand:** deterministic acoustic hive telemetry on a mesh network, read without opening a hive

```text
Hex sensor node seated inside a commercial beehive: the moulded amber node body between
two frames, bees moving unhurried across the comb around it, a status LED breathing slowly,
wax capping and pollen visible on the frame face.
Camera: 60mm macro, locked-off, no camera move.
Lighting: warm low-angle daylight through the hive entrance, soft and honeyed.
Palette: pale grey hardware #f4f4f4 and #e0e0e0, comb amber #ffb300, one deep
red indicator #d32f2f.
Motion: the bees' own movement and the breathing LED. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

---

## Delivered

All 28 clips generated on 2026-09-11, 2026-09-12 and 2026-09-13 are installed, wired into their slot, and
verified with `check:contract`, `check:assets`, `qa` and `qa:visual`. Each ships
as `<slug>-<slot>.webm` + `.mp4` + `-poster.webp`.

| Site | Placement |
|---|---|
| tendonforge | masked type fill |
| the-cryo-biome-crypt | hero background |
| mash-and-manifold | marquee strip |
| the-salt-barrow-malt-shieling | hover reveal |
| magnaloom | grid tile |
| pentland-acoustic-telemetry-works | sticky rail loop |
| lv-74-marine-apothecary | hero inset frame |
| the-cryo-pelagic-cell | modal feature |
| k-92-maritime-victualling | split panel |
| the-fenland-yeast-guild | footer ambient |
| k-44-ordnance-canvas | inline process demo |
| codex-parallax | hover reveal |
| litho-acoustic-labs | hero background |
| abyssal-crust-vaults | masked type fill |
| cedar-and-salt | sticky rail loop |
| lock-and-sluice | grid tile |
| mantlecut-geology | hero inset frame |
| sarek-bark-gear | footer ambient |
| the-hardpan-outfitter | section transition band |
| halcyon-tare | section transition band |
| sub-lithic-seals | split panel |
| sub-litho-kinetic | inline process demo |
| aegir-thermal-lugger | sticky rail loop |
| deep-crust-mycelial | modal feature |
| hverir-hearth | hero inset frame |
| marion-fissure | marquee strip |
| brimstone-basalt | hover reveal |
| stave-and-hoops | section transition band |

Earlier clips (14 sites, `leafbind` through `grainfold`) were installed before
this queue existed and are recorded in `audit/REMEDIATION.md`.

## Playback

Ambient placements carry `autoplay muted loop playsinline` and start on their
own; an IntersectionObserver pauses them off-screen so they cost nothing while
unseen. The four hover-reveal placements start on hover or keyboard focus and run
the pass to completion when the pointer leaves rather than cutting mid-frame. The
five modal placements play when the dialog opens and reset to the poster when it
closes; the dialog traps focus, closes on Escape, and returns focus to the tile
that opened it. On both kinds the ambient observer is scoped away from the clip,
so an interaction-driven placement is never also autoplayed into view.

Under `prefers-reduced-motion` the script strips `autoplay` and pauses every clip,
leaving the poster frame showing. The reduced-motion CSS neutralises the slot with
`animation: none` rather than `display: none` — the clip *is* the slot's visual
now, so hiding it would leave a hole where a paused poster frame belongs.
