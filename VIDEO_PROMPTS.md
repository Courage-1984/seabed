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

**Write the prompt from the site, not from the slug.** Read the site’s hero copy
and `meta.blurb` first: `verdigris-and-salt` is a hyperbaric diving clinic, not a
patina workshop, and `xenon-arc` welds titanium, it does not make lamps. Two clips
were wasted on that mistake.

**Never put a machine-readable colour value in a prompt** — not `#rrggbb`, not
`hsl(...)`, not `rgb(...)`. The generator renders them as literal on-screen text.
Seven of 88 clips came back defaced this way: `#eab308` printed across a tool, a
fake application window labelled with four palette codes, `hsl (28,92%,48%)`
floating over a tow strap, `#f2a900` engraved on a brass nameplate. Name the
colours in prose, and put colour codes, lettering and UI chrome in the negatives.

**Coverage: 83 of 88 sites have their clip installed**, of which 78 are clean and
five are shipping with a text artefact pending a replacement. The remaining five
are back on their still. Every site in the repo has been through remediation.

---

## Pending — corrections (10 clips)

Ten clips were rejected on review. **Five are unusable as content** — wrong
business or a caption their own footage contradicts — and those five sites have
been rolled back to the still they shipped with; the pages are complete and
passing as they stand. **Five more are still live** with the right footage but a
CSS colour string rendered into the frame; those are listed separately below.

Two were rejected because **the prompt was written from the slug rather than from
the site**, so the footage shows the wrong business. Two were rejected because the
generator **rendered the palette hex codes as literal on-screen text**. One was
rejected because the footage **contradicts the caption printed beside it**.

**Prompt rule changed as a result: never put `#rrggbb` values in a generation
prompt.** The model treats them as strings to draw. Colours are named in prose
from here on, and the negatives call out hex codes and UI chrome explicitly.

Download each into `./videos_new/` and say "the corrections are in".

| # | Save as | Slug | Placement | Why it was rejected |
|---|---|---|---|---|
| 1 | `verdigris-and-salt.mp4` | verdigris-and-salt | grid tile | showed a copper patina bath; the site is a hyperbaric diving clinic |
| 2 | `xenon-arc.mp4` | xenon-arc | modal feature | showed a xenon lamp striking; the tile promises a titanium weld pass |
| 3 | `substratum-signals.mp4` | substratum-signals | inline process demo | fake UI covered in literal hex codes and garbled words |
| 4 | `abyssal-data-recovery.mp4` | abyssal-data-recovery | inline process demo | `#eab308` printed across the tool in frame |
| 5 | `halyard-and-hemp-sailmakers.mp4` | halyard-and-hemp-sailmakers | inline process demo | a hot iron, under a caption that reads "no heat" |
| 6 | `the-hardpan-outfitter.mp4` | the-hardpan-outfitter | section transition band | `hsl (28,92%,48%)` on the tow strap |
| 7 | `gimbal-and-hoist.mp4` | gimbal-and-hoist | hover reveal | `#f2a900` on the block nameplate |
| 8 | `mantlecut-geology.mp4` | mantlecut-geology | hero inset frame | two `hsl()` strings at the frame edges |
| 9 | `pentland-acoustic-telemetry-works.mp4` | pentland-acoustic-telemetry-works | sticky rail loop | `hsl(160.85%,45%)` on the scope |
| 10 | `the-brass-and-thistle.mp4` | the-brass-and-thistle | hover reveal | `#2a2725` on the ironwork |

### 1. verdigris-and-salt — grid tile

- **Site:** `sites/2026-07/verdigris-and-salt/`
- **Target file:** `assets/verdigris-and-salt-grid-tile.webm`
- **Where it lands:** one cell of the card-stack grid, under the caption
  "Attended Halide Aerosol Cycle — Nebulised halide delivered inside the Aegir-4
  chamber, clinician-attended for the full cycle."
- **Brand:** physician-monitored hyperbaric seawater immersion and cold halide
  therapy for commercial saturation divers, Peterhead. **Not** patina conservation.

```text
Nebulised halide cycle inside a hyperbaric chamber: a stainless atomiser head
mounted on the chamber wall releasing a fine cold aerosol in slow pulses, the mist
rolling down across riveted steel and pooling along the bench, a lit porthole
behind it.
Camera: 85mm, locked-off on the atomiser, no camera move.
Lighting: cold clinical light from the porthole, deep falloff into the chamber.
Palette: near-black chamber steel, cold slate blue-grey on the plating, a soft
sea-green indicator glow, pale mint white on the aerosol.
Motion: the pulse of the aerosol and the mist settling. Must loop seamlessly.
Negatives: no on-screen text, no colour codes or hex values rendered anywhere, no
user interfaces or screens, no logos, no recognisable faces, no people in frame,
no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 2. xenon-arc — modal feature

- **Site:** `sites/2026-07/xenon-arc/`
- **Target file:** `assets/xenon-arc-modal-feature.webm`
- **Where it lands:** inside the dialog opened from the tile that reads "Inside the
  XA-7 clean-room — One titanium repair pass, filmed from the open door frame."
- **Brand:** rapid-deployment ISO 4 mobile clean-room welding units for on-site
  zero-defect titanium and inconel fabrication. **Not** lamp manufacture.

```text
A titanium repair pass filmed from the open door frame of a containerised
clean-room: a TIG torch laying a stacked-dime weld bead along a titanium pipe
section on the bench, argon shield holding the arc steady, the blue-white arc
throwing hard light across the white panel walls, extraction hood above, gas
bottles racked at the back.
Camera: 50mm, locked-off just inside the door frame, no camera move.
Lighting: the arc is the key light; the clean-room panels bounce it cold.
Palette: clinical white panels, brushed steel bench, an intense blue-white arc,
deep shadow outside the door, one amber status lamp.
Motion: the bead advancing and the arc flicker. Must loop seamlessly.
Negatives: no on-screen text, no colour codes or hex values rendered anywhere, no
user interfaces or screens, no logos, no recognisable faces (hood down, no visible
face), no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 3. substratum-signals — inline process demo

- **Site:** `sites/2026-07/substratum-signals/`
- **Target file:** `assets/substratum-signals-inline-process-demo.webm`
- **Where it lands:** the process demo frame beside the three inversion steps,
  captioned "Acoustic-Sentry Grid, North Sea — one ambient wavefront resolved into
  strata."
- **Brand:** high-resolution acoustic sub-surface waveform inversion and real-time
  seafloor telemetry without invasive seismic drilling.
- **Note:** the previous attempt came back as a screenshot of an application
  window. Keep it a physical volumetric object in a dark room, not a display.

```text
A volumetric seismic inversion block resolving in mid-air: a rectangular slab of
sub-seafloor strata rendered as a glowing translucent volume above a dark bench,
its layers separating and settling into place one band at a time, colour-graded by
velocity from cool shallow sediment to warm dense bedrock.
Camera: 50mm, locked-off three-quarter view, no camera move.
Lighting: the volume is self-luminous; the room around it is black.
Palette: black room, cool deep blue in the shallow layers grading through pale
green to a warm ochre at depth, a faint cyan grid plane beneath.
Motion: the layers resolving and settling. Must loop seamlessly.
Negatives: no on-screen text, no colour codes or hex values rendered anywhere, no
application windows, no buttons, tabs, panels, axis labels, tick numbers or any
user interface chrome, no monitors or screens, no logos, no recognisable faces,
no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 4. abyssal-data-recovery — inline process demo

- **Site:** `sites/2026-05/abyssal-data-recovery/`
- **Target file:** `assets/abyssal-data-recovery-inline-process-demo.webm`
- **Where it lands:** the process demo frame beside the three recovery steps,
  captioned "One NAND package lifted, cleaned and read."
- **Brand:** recovering telemetry and visual logs from silicon pulled off the
  ocean floor.
- **Note:** the scene was right last time — only the lettering on the tool spoiled
  it. Same shot, nothing written on anything.

```text
NAND package lifted under a microscope: hot air held low while a scorched memory
chip releases from a corroded board, solder balls giving way one edge at a time,
white salt residue crusted around the pads, plain unmarked tweezers steadying it.
Camera: 100mm macro through the scope framing, locked-off.
Lighting: ring light, clinical and even.
Palette: near-black board, copper traces, a plain yellow tool handle with nothing
printed on it, clean off-white bench.
Motion: the lift, in small increments. Must loop seamlessly.
Negatives: no on-screen text, no colour codes or hex values rendered anywhere, no
writing, lettering, part numbers or labels on any tool or handle, no user
interfaces or screens, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

---

### 5. halyard-and-hemp-sailmakers — inline process demo

- **Site:** `sites/2026-06/halyard-and-hemp-sailmakers/`
- **Target file:** `assets/halyard-and-hemp-sailmakers-inline-process-demo.webm`
- **Where it lands:** the process demo frame beside the three steps, captioned
  "Waxed flax twine, worked by hand. **No heat, no bonding.**"
- **Brand:** hand-stitched flax and hemp canvas sails for wooden boats, Isle of Bute.
- **Note:** the previous attempt came back as a hot flat iron pressing the canvas,
  directly under a caption that says "no heat". Nothing hot, nothing powered —
  this has to be a needle and twine.

```text
Hand-stitching a flat-felled seam in flax sailcloth: a sailmaker's needle driven
through two folded layers of heavy natural canvas, waxed twine drawn taut and set
with a seam rubber, a leather palm guiding each stitch, the seam advancing one
stitch at a time along a scrubbed bench.
Camera: 90mm macro, locked-off on the seam, no camera move.
Lighting: soft daylight from a loft window, raking across the weave.
Palette: undyed flax canvas, warm honey wax on the twine, worn oak bench, dark
leather palm.
Motion: needle through, twine pulled taut, repeat. Must loop seamlessly.
Negatives: no irons, no heat sources, no steam, no machines or sewing machines, no
on-screen text, no colour codes or hex values rendered anywhere, no logos, no
recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

---

### The text-leak group (6–10)

These five are **still wired and live**. Their footage is right and their captions
are honest — each one simply has a CSS colour string rendered into the frame,
which is the same generator failure as 3 and 4 above. They were left in place
because the replacement overwrites `<slug>-<slot>.webm`/`.mp4`/`-poster.webp` and
needs no markup change, and because three of them have no still to fall back to:
their slots were built around the clip. Say the word if you would rather they came
down until the replacements land.

Each prompt below is the original scene with the palette rewritten in prose.

### 6. the-hardpan-outfitter — section transition band

- **Site:** `sites/2026-08/the-hardpan-outfitter/`
- **Target file:** `assets/the-hardpan-outfitter-section-transition-band.webm`
- **Leak:** `hsl (28,92%,48%)` on a label over the tow strap, mid-left of frame.
- **Caption it sits under:** "Ground recovery — ballast sled under tow, Aberdeenshire hardpan"

```text
A loaded ground-sled under tow across frozen hardpan: a steel ballast sled stacked
with track mats dragging over cracked, ice-plated ground, an orange tow strap
coming taut from the bottom-left of frame, plates of surface ice breaking under
the runners.
Camera: 35mm, locked-off low and level with the ground, no camera move.
Lighting: flat overcast winter daylight, no sun.
Palette: grey-blue ice plate, weathered gunmetal on the sled, a strong safety
orange on the strap, bone-white sky.
Motion: the strap coming taut and the sled inching forward. Must loop seamlessly.
Negatives: no on-screen text, no colour codes, hex values or CSS colour functions
rendered anywhere, no labels, tags or lettering on the strap or the sled, no user
interfaces, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 7. gimbal-and-hoist — hover reveal

- **Site:** `sites/2026-07/gimbal-and-hoist/`
- **Target file:** `assets/gimbal-and-hoist-hover-reveal.webm`
- **Leak:** `#f2a900` engraved on the block's brass nameplate, centre of frame.
- **Caption it sits under:** "Hover or focus to watch the lift"

```text
A rigging block under load on the quayside: a heavy snatch block running wire rope
through its sheave, the rope advancing steadily under load, sea spray beading on
the housing, an unmarked brass plate riveted to the cheek.
Camera: 85mm, locked-off on the block against open sky, no camera move.
Lighting: flat coastal overcast.
Palette: gunmetal housing, galvanised wire, warm unengraved brass on the plate,
pale grey sky.
Motion: the rope running and the sheave turning. Must loop seamlessly.
Negatives: no on-screen text, no colour codes, hex values or CSS colour functions
rendered anywhere, no engraving, stamping, part numbers or lettering on the brass
plate or anywhere else, no user interfaces, no logos, no recognisable faces, no
watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 8. mantlecut-geology — hero inset frame

- **Site:** `sites/2026-08/mantlecut-geology/`
- **Target file:** `assets/mantlecut-geology-hero-inset-frame.webm`
- **Leak:** `hsl(210.85%,45%)` at the left edge and `hsl(38.95%,52%)` at the right.
- **Caption it sits under:** "Diamond-wire bead strand — continuous cut, zero percussion"

```text
A diamond-wire bead strand running through a granite kerf: the beaded wire drawing
steadily through a deepening slot in a granite face, cooling water sheeting down
the stone and spraying off the wire, the cut advancing with no impact or hammering.
Camera: 70mm, locked-off square to the face, no camera move.
Lighting: one work lamp raking across the wet stone, dark beyond it.
Palette: grey-blue granite, bright steel on the wire, white water, a warm lamp
glow at the right edge.
Motion: the wire running and the water sheeting. Must loop seamlessly.
Negatives: no on-screen text, no colour codes, hex values or CSS colour functions
rendered anywhere, no control panels, gauges, displays or readouts in frame, no
labels or lettering, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 9. pentland-acoustic-telemetry-works — sticky rail loop

- **Site:** `sites/2026-08/pentland-acoustic-telemetry-works/`
- **Target file:** `assets/pentland-acoustic-telemetry-works-sticky-rail-loop.webm`
- **Leak:** `hsl(160.85%,45%)` printed on the oscilloscope screen behind the part.
- **Caption it sits under:** "Mark VI transducer head — bench test before sea trials"

```text
A transducer head under bench test: a machined stainless sensor head clamped in a
vice with its potting compound curing, thin smoke curling past it, an analogue
oscilloscope behind showing a clean unlabelled waveform on a plain graticule.
Camera: 50mm, locked-off, shallow depth so the scope sits soft behind the part.
Lighting: a bench lamp from the right, fluorescent fill above.
Palette: brushed stainless on the head, cast grey vice, pale cream instrument
housings, a cyan trace on the scope.
Motion: the smoke curling and the trace sweeping. Must loop seamlessly.
Negatives: no on-screen text, no colour codes, hex values or CSS colour functions
rendered anywhere, nothing written on the oscilloscope screen except the waveform
itself, no menu text, readouts, numbers or axis labels on any display, no logos,
no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 10. the-brass-and-thistle — hover reveal

- **Site:** `sites/2026-07/the-brass-and-thistle/`
- **Target file:** `assets/the-brass-and-thistle-hover-reveal.webm`
- **Leak:** `#2a2725` stencilled on the green ironwork, upper right of frame.
- **Caption it sits under:** "Hover or focus to watch the fire"

```text
Oak burning in a clay cob oven aboard a narrowboat galley: split oak settling into
a bed of embers inside a domed clay oven, flame licking up the inner wall, the
green-painted iron of the boat's fittings framing the mouth of the oven.
Camera: 70mm, locked-off square to the oven mouth, no camera move.
Lighting: the fire is the only source.
Palette: pale clay dome, deep ember orange, near-black beyond the mouth, bottle
green on the ironwork.
Motion: flame movement and embers collapsing. Must loop seamlessly.
Negatives: no on-screen text, no colour codes, hex values or CSS colour functions
rendered anywhere, no stencilling, signwriting, numbers or lettering on the
ironwork or the boat, no user interfaces, no logos, no recognisable faces, no
watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

---

### Accepted with a note

`lithic-resonance` came back as an English moorland granite tor under moving
cloud. The site casts its diffusers from repurposed Johannesburg mine tailings,
so the geology and the green grass are both wrong for the brand. It is kept
because the slot is a hero background: decorative, aria-hidden, and sitting under
a heavy scrim where it reads as stone mass rather than as a place. Worth
regenerating if the queue is ever idle; not worth a slot in this batch.

---

## Delivered

The 46 clips generated on 2026-09-19 (batches 6, 7 and 8) are installed and wired,
less the five listed above. The 28 clips generated on 2026-09-11, 2026-09-12 and 2026-09-13 are installed, wired into their slot, and
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
