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

**Coverage: 42 of 88 sites have their clip installed.** Thirty-four more are
prepped and awaiting their clip — 12 from batch 6 and 22 from batch 7 — and the
remaining 12 have not been through remediation yet.

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

## Pending — batch 7 (22 clips)

Twenty-two sites are prepped and passing every gate — check:contract, check:assets,
qa and qa:visual, with zero visual findings. Each is waiting on its clip. The slots
are live now with a still in place, so the pages are complete and correct without
video; the clip replaces the still when it lands.

Download each into `./videos_new/` and say "the videos are in".

| # | Save as | Slug | Placement |
|---|---|---|---|
| 1 | `1. hearth-and-anvil.mp4` | 1. hearth-and-anvil | split panel |
| 2 | `2. substratum-signals.mp4` | 2. substratum-signals | inline process demo |
| 3 | `3. verdigris-and-salt.mp4` | 3. verdigris-and-salt | grid tile |
| 4 | `4. xenon-arc.mp4` | 4. xenon-arc | modal feature |
| 5 | `5. vapour-and-vault.mp4` | 5. vapour-and-vault | hero background |
| 6 | `6. the-tidal-vault.mp4` | 6. the-tidal-vault | masked type fill |
| 7 | `7. siloshield-dynamics.mp4` | 7. siloshield-dynamics | inline process demo |
| 8 | `8. signal-and-silo.mp4` | 8. signal-and-silo | grid tile |
| 9 | `9. the-slate-and-chisel.mp4` | 9. the-slate-and-chisel | hero inset frame |
| 10 | `10. the-midnight-forager.mp4` | 10. the-midnight-forager | section transition band |
| 11 | `11. the-brass-and-thistle.mp4` | 11. the-brass-and-thistle | hover reveal |
| 12 | `12. patch-parcel.mp4` | 12. patch-parcel | footer ambient |
| 13 | `13. oxide-and-tide.mp4` | 13. oxide-and-tide | split panel |
| 14 | `14. null-state-cryogenics.mp4` | 14. null-state-cryogenics | sticky rail loop |
| 15 | `15. nepenthes-forge.mp4` | 15. nepenthes-forge | modal feature |
| 16 | `16. lithic-resonance.mp4` | 16. lithic-resonance | hero background |
| 17 | `17. lithic-fibre-dynamics.mp4` | 17. lithic-fibre-dynamics | hero inset frame |
| 18 | `18. knot-and-westerly.mp4` | 18. knot-and-westerly | masked type fill |
| 19 | `19. karoo-brass-and-glass.mp4` | 19. karoo-brass-and-glass | marquee strip |
| 20 | `20. k9-kinetic-recovery.mp4` | 20. k9-kinetic-recovery | hover reveal |
| 21 | `21. hull-and-hem-sailmenders.mp4` | 21. hull-and-hem-sailmenders | section transition band |
| 22 | `22. halyard-and-hemp-sailmakers.mp4` | 22. halyard-and-hemp-sailmakers | inline process demo |

### 1. hearth-and-anvil — split panel

- **Site:** `sites/2026-07/hearth-and-anvil/`
- **Target file:** `assets/hearth-and-anvil-split-panel.webm`
- **Where it lands:** the media half of the asymmetric split, inside the narrow rail beside the deployment metrics
- **Brand:** architectural bronze and ironwork cast and restored for heritage buildings

```text
Foundry pour: molten bronze running from a tilting crucible into a sand mould, the
stream throwing sparks that arc and die, the mould box glowing at its seams, dark
workshop beyond.
Camera: 50mm, locked-off medium close-up on the pour, no camera move.
Lighting: the melt is the only real source — deep shadow everywhere else.
Palette: near-black #121110, warm shadow #1e1b18, forge orange #e05a2b in the metal
itself, pale ash #eae6e1 on the rising smoke.
Motion: the pour and the spark arcs. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 2. substratum-signals — inline process demo

- **Site:** `sites/2026-07/substratum-signals/`
- **Target file:** `assets/substratum-signals-inline-process-demo.webm`
- **Where it lands:** the process demo frame in the inversion workflow section, at rest on its poster
- **Brand:** sub-surface geophysical survey and seismic inversion modelling

```text
Seismic inversion building on a dark operator screen: a 3D block model of sub-surface
strata assembling layer by layer, velocity bands resolving from blur into sharp
horizons, a fault plane snapping into place.
Camera: locked-off screen capture framing, very slight push-in.
Lighting: screen-lit only, the room dark.
Palette: near-black #080e14, panel slate #101a24, signal teal #00a896 for the active
horizon, off-white #e2e8f0 labels out of focus.
Motion: the model resolving and refining. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 3. verdigris-and-salt — grid tile

- **Site:** `sites/2026-07/verdigris-and-salt/`
- **Target file:** `assets/verdigris-and-salt-grid-tile.webm`
- **Where it lands:** one cell of the card-stack grid, sized as a 16:9 tile beside its neighbours
- **Brand:** copper patina conservation and controlled halide treatment

```text
Copper sheet taking its patina in a treatment bath: pale green verdigris blooming
across bright metal in slow irregular fronts, salt crystals forming at the waterline,
the surface shifting from penny-bright to sea-green.
Camera: 90mm macro, locked-off top-down, no camera move.
Lighting: soft even north light, no specular hotspots.
Palette: near-black ground #0b1317, tank slate #142229, verdigris #2a9d8f in the
patina, pale mint #e0f2f1 on the salt bloom.
Motion: the patina front creeping and crystals growing. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 4. xenon-arc — modal feature

- **Site:** `sites/2026-07/xenon-arc/`
- **Target file:** `assets/xenon-arc-modal-feature.webm`
- **Where it lands:** inside the dialog the poster tile opens — the largest the clip is ever shown
- **Brand:** xenon short-arc lamp manufacture in a class-100 cleanroom

```text
Xenon short-arc lamp striking inside a cleanroom test rig: the arc jumping the
electrode gap and stabilising into a hard blue-white point, quartz envelope flaring,
the gantry behind it in clean shadow.
Camera: 100mm, locked-off tight on the electrode gap, no camera move.
Lighting: the arc is the only source; everything else falls to black.
Palette: near-black #08080a, instrument grey #1a1b20 and #2e3039, electric cyan
#00e5ff in the arc bloom.
Motion: the strike, the flicker settling, the steady burn. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 5. vapour-and-vault — hero background

- **Site:** `sites/2026-07/vapour-and-vault/`
- **Target file:** `assets/vapour-and-vault-hero-background.webm`
- **Where it lands:** full-bleed behind the hero, under an engineered scrim sized for a moving image
- **Brand:** deep-mine geothermal broth maturation in a disused slate working
- **Note:** the slot's scrim is sized for the clip's brightest frame, so the hero type holds.

```text
Deep mine chamber: rows of sealed maturation vats on slate ledges, geothermal vapour
curling off the warm rock and pooling along the floor, a single work lamp down the
tunnel throwing long shadows.
Camera: 28mm, very slow push down the chamber axis, horizon locked.
Lighting: one warm tungsten source deep in frame, cold ambient on the wet slate.
Palette: warm dark #2b231f, cold slate #1a1d20, ember orange #d47a3e on the lamp,
pale steam catching #f2efea.
Motion: rolling vapour only — the vats are still. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 6. the-tidal-vault — masked type fill

- **Site:** `sites/2026-07/the-tidal-vault/`
- **Target file:** `assets/the-tidal-vault-masked-type-fill.webm`
- **Where it lands:** visible only through the display numerals in the band, via background-clip
- **Brand:** a subterranean vestibular sanctuary built inside a historic Kent tidal pool
- **Note:** seen only through the numerals, so favour strong local contrast over a legible wide subject.

```text
Tidal water moving in a stone-walled pool: slow green swell rising and falling against
cut Kentish ragstone, light refracting in moving bands across the submerged wall,
weed lifting and settling with the surge.
Camera: 50mm, locked-off half-submerged framing, no camera move.
Lighting: overcast daylight from above, caustics doing the work.
Palette: deep green-black #162e25, sage #79988d in the water, terracotta #b85c37 on a
rusted fixing, near-white #faf9f6 on the surface glare.
Motion: the swell and the caustic bands — high local contrast, which is what reads
through cut-out letterforms. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 7. siloshield-dynamics — inline process demo

- **Site:** `sites/2026-07/siloshield-dynamics/`
- **Target file:** `assets/siloshield-dynamics-inline-process-demo.webm`
- **Where it lands:** the process demo frame in the deployment section
- **Brand:** operational-technology security hardware for agricultural silo controllers

```text
Edge security appliance being clamped to a silo controller cabinet: the black box
seated onto its DIN rail, status LEDs walking through their boot sequence green by
green, ribbon cable dressed to one side.
Camera: 60mm macro, locked-off, no camera move.
Lighting: one cool work light from the left, cabinet interior in shadow.
Palette: near-black #11111b, cabinet slate #1e1e2e and #313244, terminal green #a6e3a1
on the LEDs.
Motion: the boot sequence walking across the LED bank. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 8. signal-and-silo — grid tile

- **Site:** `sites/2026-07/signal-and-silo/`
- **Target file:** `assets/signal-and-silo-grid-tile.webm`
- **Where it lands:** one cell of the bento grid, sized and gapped identically to its neighbouring tiles
- **Brand:** acoustic grain-stock telemetry clamped to galvanised silos in the Swartland

```text
Galvanised grain silo at first light: the corrugated flank filling frame, a small
sensor unit clamped to the structural ribbing, heat shimmer rising off the steel, dry
wheatland behind going gold.
Camera: 70mm, locked-off, no camera move.
Lighting: low raking sunrise across the corrugations.
Palette: slate #2a3439, harvest gold #d49b43 in the light, rust orange #c25e30 on a
weathered bracket, bone #f4f2ee sky.
Motion: heat shimmer and slow-moving light only. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 9. the-slate-and-chisel — hero inset frame

- **Site:** `sites/2026-07/the-slate-and-chisel/`
- **Target file:** `assets/the-slate-and-chisel-hero-inset-frame.webm`
- **Where it lands:** the framed inset in the hero column, above the commission CTA
- **Brand:** hand-cut Roman Deep-V lettering in Portland limestone

```text
Letter-carving in close-up: a tungsten chisel driven by a wooden mallet cutting the
V-trough of a Roman capital into pale Portland limestone, stone dust leaping with each
strike, the cut face catching light along its forty-five-degree wall.
Camera: 100mm macro, locked-off on the cut, no camera move.
Lighting: hard raking side light so the V reads as depth, not line.
Palette: charcoal #2c2e2b, lichen green #5d6b5e, oxide #9d5838 on the mallet head,
limestone #f5f2ec.
Motion: the mallet strikes and the dust. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 10. the-midnight-forager — section transition band

- **Site:** `sites/2026-07/the-midnight-forager/`
- **Target file:** `assets/the-midnight-forager-section-transition-band.webm`
- **Where it lands:** a full-width band between the ledger and the seasonal calendar
- **Brand:** nocturnal foraging in Caledonian pine forest, cut and chilled the same night

```text
Night forest floor under a head torch: the beam sweeping slowly across moss, pine
litter and a cluster of chanterelles, everything beyond the beam falling to black, fine
mist hanging in the light cone.
Camera: 35mm, slow lateral sweep following the torch beam.
Lighting: single hard torch source, no fill.
Palette: near-black #050a10, forest navy #0b131f and #1c2a39, old gold #d4af37 where
the beam finds the caps.
Motion: the travelling beam and drifting mist. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 11. the-brass-and-thistle — hover reveal

- **Site:** `sites/2026-07/the-brass-and-thistle/`
- **Target file:** `assets/the-brass-and-thistle-hover-reveal.webm`
- **Where it lands:** behind the "Cob Oven" card — poster at rest, clip on hover and keyboard focus, and it plays its pass out rather than cutting when the pointer leaves
- **Brand:** a narrowboat galley cooking from a hand-built clay cob oven

```text
Clay cob oven mouth in a narrowboat galley: English oak burning down to a bed of
embers inside the dome, flame licking the clay crown and dying back, brass fittings on
the bulkhead catching the firelight.
Camera: 50mm, locked-off on the oven mouth, no camera move.
Lighting: firelight only, the galley dark around it.
Palette: deep green #1b3b2b, brass #c39b4b, dark timber #2a2725, ember orange in the
fire itself.
Motion: the flame breathing and embers shifting. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 12. patch-parcel — footer ambient

- **Site:** `sites/2026-07/patch-parcel/`
- **Target file:** `assets/patch-parcel-footer-ambient.webm`
- **Where it lands:** full-width band across the footer, behind the closing block under a heavy scrim
- **Brand:** visible mending kits and heritage repair cloth, posted monthly

```text
Sashiko stitching in progress: a needle drawing indigo thread through worn cotton in
steady running stitch, the patch beneath showing through, cloth shifting slightly with
each pull.
Camera: 90mm macro, locked-off top-down, no camera move.
Lighting: soft window light from the left, gentle falloff.
Palette: forest green #355c4d, warm ochre #d28a48, madder red #a33d45 in the thread,
oatmeal #f8f5ef cloth.
Motion: the needle and thread only — hands may enter frame but no faces. Must loop
seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 13. oxide-and-tide — split panel

- **Site:** `sites/2026-07/oxide-and-tide/`
- **Target file:** `assets/oxide-and-tide-split-panel.webm`
- **Where it lands:** the media half of the "Proved, not polished" split band
- **Brand:** restoration of deep-sea diving helmets, pressure-proved before they ship

```text
Copper diving helmet under hydrostatic test: the helmet held in a cast-iron chamber
slowly filling with water, bubbles streaming off the bonnet and the brazed seams, the
viewport glass distorting as the level rises past it.
Camera: 70mm, locked-off through the chamber port, no camera move.
Lighting: one hard lamp above the water line, refraction doing the rest.
Palette: oxidised copper #84593c, deep tank green #22332b, brass #d49a5b on the
fittings, dark water.
Motion: the rising water and bubble streams. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 14. null-state-cryogenics — sticky rail loop

- **Site:** `sites/2026-07/null-state-cryogenics/`
- **Target file:** `assets/null-state-cryogenics-sticky-rail-loop.webm`
- **Where it lands:** the sticky rail in the hero's left column — on screen for that whole scroll, so it has to stay quiet enough to sit beside reading
- **Brand:** hydraulically compressed, zero-oxygen ice monoliths leased to hospitality

```text
Clear ice monolith under acoustic degassing: a thick block held in a steel frame with
fine bubble columns rising and vanishing as dissolved gas is driven out, the ice going
from cloudy to optically clear.
Camera: 85mm, locked-off, no camera move.
Lighting: hard backlight through the block so clarity reads; everything else dark.
Palette: near-black #12161a, steel #2b353d, electric cyan #00e5ff on the rig telltale,
clear ice.
Motion: the bubble columns and the clearing front — slow and quiet. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 15. nepenthes-forge — modal feature

- **Site:** `sites/2026-06/nepenthes-forge/`
- **Target file:** `assets/nepenthes-forge-modal-feature.webm`
- **Where it lands:** inside the dialog the poster tile opens, at body level so the overlay is viewport-fixed
- **Brand:** sealed climate-isolation containment for carnivorous flora

```text
Nepenthes pitcher inside a sealed containment case: condensation beading and running
down the acrylic wall, humidity fogging and clearing in slow cycles, the pitcher's lid
glistening, fine mist injected from a nozzle at the top of frame.
Camera: 60mm macro, locked-off, no camera move.
Lighting: cool grow-light from above, slightly clinical.
Palette: deep oxblood #7a1a21 on the case seal, moss green #4b5e40 in the plant, cool
grey #9ba4b5 hardware, near-white #f5f5f2 in the fog.
Motion: the fog cycle and running condensation. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 16. lithic-resonance — hero background

- **Site:** `sites/2026-06/lithic-resonance/`
- **Target file:** `assets/lithic-resonance-hero-background.webm`
- **Where it lands:** full-bleed behind the "Heavy. Absolute." hero, under a heavy scrim
- **Brand:** monolithic granite acoustic masses for critical listening rooms

```text
Weathered granite boulders on open moorland: a ring of massive stones under fast
low cloud, shadow moving across their lichen-crusted faces as the light changes, grass
bending in the wind at their base.
Camera: 24mm, locked-off wide, no camera move — the sky does the moving.
Lighting: overcast with breaks; travelling cloud shadow is the whole event.
Palette: near-black #11111b, granite slate #1e1e2e and #313244, a cold lilac cast
#cba6f7 in the cloud light.
Motion: cloud shadow tracking across the stone, grass moving. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 17. lithic-fibre-dynamics — hero inset frame

- **Site:** `sites/2026-06/lithic-fibre-dynamics/`
- **Target file:** `assets/lithic-fibre-dynamics-hero-inset-frame.webm`
- **Where it lands:** an inset frame over the hero image, inside the hero image wrapper
- **Brand:** fibre routed through historic masonry by survey micro-drone, without cutting stone

```text
Micro-drone in a Victorian ventilation void: a small tracked crawler working along a
soot-lined brick shaft, its lamp raking the mortar courses, dust turning in the beam,
a blue fibre line paying out behind it.
Camera: 35mm, slow follow behind the crawler.
Lighting: the crawler's own lamp only, hard and close.
Palette: cold stone #2a2f33, brick orange #b86b40 where the lamp lands, optic blue
#1d6ba6 on the fibre, pale mortar #f5f3ec.
Motion: the crawl, the paying-out line, turning dust. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 18. knot-and-westerly — masked type fill

- **Site:** `sites/2026-06/knot-and-westerly/`
- **Target file:** `assets/knot-and-westerly-masked-type-fill.webm`
- **Where it lands:** visible only through the "9 kN" numerals in the band, via the layered SVG knockout
- **Brand:** guyed anchor systems proof-tested on exposed hillside
- **Note:** seen only through the letterforms, so favour movement and contrast over a wide legible subject.

```text
Steel tension cable under load: a marine-grade wire rope and turnbuckle anchored to a
moss-covered trunk, the line singing taut and shedding water, the whole rig shifting a
few degrees in gusting wind.
Camera: 85mm, locked-off tight on the turnbuckle, no camera move.
Lighting: flat overcast hill light, one cold specular on the wet steel.
Palette: deep green-black #1c2b24, wet slate #2c3539, rope tan #d4a373, dark moss.
Motion: the cable vibration and water shedding — high local contrast, which reads well
through cut-out numerals. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 19. karoo-brass-and-glass — marquee strip

- **Site:** `sites/2026-06/karoo-brass-and-glass/`
- **Target file:** `assets/karoo-brass-and-glass-marquee-strip.webm`
- **Where it lands:** riding the drifting band above the catalogue — it appears twice, in both identical halves of the loop
- **Brand:** restoration of antique brass barometers and scientific glass in the Karoo

```text
Brass barometer movement on a restorer's bench: a gloved hand turning the aneroid
capsule slowly under a loupe, engraved scale catching the light, mercury-bright brass
against dark felt.
Camera: 100mm macro, locked-off, no camera move.
Lighting: one warm angled lamp, deep falloff to black.
Palette: aged brass #8a6327, deep blue-slate #2a3b4c, oxblood #4a2011 on the case
leather, bone #f4f1ea dial.
Motion: the slow turn and travelling highlight. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 20. k9-kinetic-recovery — hover reveal

- **Site:** `sites/2026-06/k9-kinetic-recovery/`
- **Target file:** `assets/k9-kinetic-recovery-hover-reveal.webm`
- **Where it lands:** behind the "Underwater Treadmill" card — poster at rest, clip on hover and keyboard focus, playing its pass out when the pointer leaves
- **Brand:** mobile canine hydrotherapy for working and retired service dogs

```text
Underwater treadmill tank: a dog walking steadily on the submerged belt, water pushing
in slow bow-waves around its chest, bubbles trailing off its coat, the tank glass
streaked with condensation.
Camera: 50mm, locked-off side-on through the tank glass, no camera move.
Lighting: even clinical light from above the water, clean and bright.
Palette: deep teal #1e3a4c, steel #4a6070, warm tan #d48c46 on the dog's coat, clinical
off-white #f7f9fa.
Motion: the gait and the water displacement. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 21. hull-and-hem-sailmenders — section transition band

- **Site:** `sites/2026-06/hull-and-hem-sailmenders/`
- **Target file:** `assets/hull-and-hem-sailmenders-section-transition-band.webm`
- **Where it lands:** a full-width band between the process and specification sections
- **Brand:** a Cornish sail loft repairing working canvas, free inspection on every bag

```text
Sail loft floor: a heavy tanbark sail spread across bleached boards, a sailmaker
drawing a long seam through a Singer 45K, the cloth feeding steadily and folding off the
bed, loft windows blown out behind.
Camera: 40mm, slow track along the seam as it feeds.
Lighting: flat north light through tall loft windows.
Palette: tanbark red #7a2e1f, deep sea blue #25405b, brass #c89f5a on the machine,
canvas cream #f4eddc.
Motion: the cloth feeding and needle working. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 22. halyard-and-hemp-sailmakers — inline process demo

- **Site:** `sites/2026-06/halyard-and-hemp-sailmakers/`
- **Target file:** `assets/halyard-and-hemp-sailmakers-inline-process-demo.webm`
- **Where it lands:** the process demo frame beside the three flat-felled-seam steps
- **Brand:** traditional flax canvas sails, hand-finished with waxed thread

```text
Flat-felled seam being worked in flax canvas: two panels lapped and beaten flat with a
seam iron, then two rows of heavy waxed brown thread drawn through five layers, the
cloth shifting with each pull.
Camera: 85mm macro, locked-off on the seam, no camera move.
Lighting: soft raking daylight so the weave and the thread relief both read.
Palette: navy slate #2c3e50, tan leather #8b5a2b, dark gold #b8860b on the waxed
thread, unbleached flax #f4efe6.
Motion: the iron pass and the stitching. Must loop seamlessly.
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
