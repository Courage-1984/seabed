# Video generation queue

Prompts for clips the remediation campaign needs. Generate each in Google Flow,
download it, drop it in `./videos_new/`, and tell the agent which site it belongs
to — or just say "the videos are in" if the whole batch is there.

The agent then runs:

```bash
npm run optimize:video -- --slug <slug> --slot "<placement>"
```

which encodes VP9 + an H.264 fallback + a poster frame, installs them into the
site's `assets/`, updates `meta.json`, and prints the markup to wire in.

**Every prompt is written for one specific brand.** The placement slot, palette
and subject all come from that site's own copy — they are not interchangeable.

---

## Pending

### 1. tendonforge — masked type fill

- **Site:** `sites/2026-08/tendonforge/`
- **Target file:** `assets/tendonforge-masked-type-fill.webm`
- **Where it lands:** visible only through the numerals "14 BAR" in the pressure band
- **Note:** the band currently shows a still; the clip replaces it.

```text

```

### 2. the-cryo-biome-crypt — hero background

- **Site:** `sites/2026-08/the-cryo-biome-crypt/`
- **Target file:** `assets/the-cryo-biome-crypt-hero-background.webm`
- **Where it lands:** full-bleed behind the hero headline, under an engineered scrim
- **Note:** the scrim is already sized for a moving image, so headline contrast
  holds against the clip's brightest frame.

```text
Subterranean cryogenic vault: rows of stainless steel dewars in low blue light,
liquid nitrogen vapour rolling slowly across a polished concrete floor and
spilling over the vessel rims, frost creeping on valve heads.
Camera: 35mm, very slow push-in down the aisle, locked horizon.
Lighting: deep blue ambient with cold white pools from overhead strip fittings.
Palette: near-black blues hsl(210,45%,8%), steel greys, teal accents hsl(174,95%,42%).
Motion: vapour drift only — slow, heavy, continuous. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 3. mash-and-manifold — marquee strip

- **Site:** `sites/2026-08/mash-and-manifold/`
- **Target file:** `assets/mash-and-manifold-marquee-strip.webm`
- **Where it lands:** inside the drifting band above the hardware section, riding
  the marquee alongside the depot slogans
- **Brand:** live sourdough biocultures propagated in industrial bioreactors and
  dosed under pressure into automated mixing lines. Leith depot.

```text
Tri-clamp stainless dosing spiral inside a bakery bioreactor hall: viscous pale
sourdough levain pushing slowly through a polished spiral auger into a stainless
hopper, thick strands folding over themselves, condensation on the jacketed vessel.
Camera: 50mm, locked-off medium close-up, no camera move - the motion is all in the dough.
Lighting: flat industrial daylight from a high window, one cool overhead fluorescent.
Palette: brushed stainless greys, warm ivory levain, deep charcoal hsl(215,22%,12%)
background, a single amber-yellow machine marking hsl(44,98%,50%).
Motion: continuous slow extrusion and fold. Must loop seamlessly with no cut.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks, no hands.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 4. the-salt-barrow-malt-shieling — hover reveal

- **Site:** `sites/2026-08/the-salt-barrow-malt-shieling/`
- **Target file:** `assets/the-salt-barrow-malt-shieling-hover-reveal.webm`
- **Where it lands:** behind the "Tidal Steep" card - poster at rest, clip on
  hover and keyboard focus
- **Brand:** heritage Bere barley steeped 54 hours in Atlantic tidal brine off the
  Rhinns of Islay,
  then floor-malted and kilned over coastal salt-turf.

```text
Heritage barley steeping in a stone tidal barrow on an Islay foreshore at Loch
Indaal: cold
green-grey seawater washing slowly over a bed of swollen barley grains, kelp fronds
at the barrow rim, foam threading between the stones as the tide works.
Camera: 35mm, low and close to the water line, very slow push-in.
Lighting: overcast northern daylight, no sun, soft and flat.
Palette: slate blue-greys, wet stone, pale straw barley, one warm amber note
hsl(42,90%,54%) from a lantern out of frame.
Motion: tidal wash in and out, continuous and unhurried. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 5. magnaloom — grid tile

- **Site:** `sites/2026-08/magnaloom/`
- **Target file:** `assets/magnaloom-grid-tile.webm`
- **Where it lands:** one cell of the bento grid, sized exactly like its neighbours
- **Brand:** core-rope memory woven by hand in copper and ferrite on a converted
  Nottingham lace loom.

```text
Extreme macro of hand-woven core-rope memory: fine enamelled copper wire being
threaded through a lattice of tiny black ferrite toroids on a brass frame, wire
sliding through ring after ring, faint metallic glint travelling along the strand.
Camera: 100mm macro, shallow depth of field, slow lateral drift right to left.
Lighting: single warm raking key from the left, deep falloff into shadow.
Palette: burnished copper and brass, matte black ferrite, deep slate hsl(215,26%,16%),
one burnt-orange highlight hsl(28,92%,48%).
Motion: the wire advancing steadily through the rings. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks, no hands in frame.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 6. pentland-acoustic-telemetry-works — sticky rail loop

- **Site:** `sites/2026-08/pentland-acoustic-telemetry-works/`
- **Target file:** `assets/pentland-acoustic-telemetry-works-sticky-rail-loop.webm`
- **Where it lands:** inside the pinned telemetry pane, at 50% opacity behind
  the readouts. It stays on screen for a long scroll, so keep it calm and dark.
- **Brand:** benthic acoustic relay nodes and 40 kHz modems built for the Pentland
  Firth tidal race.

```text
A cylindrical potted sonar transducer head clamped in a vice on a coastal workshop
bench: black polyurethane potting compound curing around the housing, an
oscilloscope trace sweeping on a bench monitor behind it, thin steam from a
soldering station drifting across the frame.
Camera: 50mm, static locked-off wide-medium, no camera move.
Lighting: cool workshop strip lighting with one warm bench lamp from frame right.
Palette: deep navy hsl(215,30%,14%) shadow, galvanised steel, black potting resin,
a teal-green oscilloscope glow hsl(168,85%,45%).
Motion: only the scope trace sweeping and the steam drifting - the object is still.
Must loop seamlessly with no cut.
Negatives: no on-screen text, no legible numerals, no logos, no recognisable faces,
no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 7. lv-74-marine-apothecary — hero inset frame

- **Site:** `sites/2026-08/lv-74-marine-apothecary/`
- **Target file:** `assets/lv-74-marine-apothecary-hero-inset-frame.webm`
- **Where it lands:** the framed object beneath the hero copy - a deliberate,
  bordered inset rather than a full-bleed background
- **Brand:** coastal balms and seawater remedies made in the lantern room of
  lightvessel LV-74, moored off Osea Island in the Blackwater Estuary.

```text
Pouring balm in a lightvessel lantern room: warm amber-green infused oil running
in a slow thread from a copper pan into a row of small tin containers on a scarred
wooden bench, steam lifting off the surface, curved brass-framed windows soft-focus
behind with estuary saltmarsh beyond.
Camera: 50mm, slight high angle, very slow push-in, shallow depth of field.
Lighting: low warm lantern light from frame left, cold blue estuary light through the windows.
Palette: deep teal-navy hsl(205,32%,18%), sea-green hsl(155,22%,36%), warm amber
oil hsl(38,90%,48%), aged brass and tin.
Motion: the continuous pour and the rising steam. Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 8. the-cryo-pelagic-cell — modal feature

- **Site:** `sites/2026-08/the-cryo-pelagic-cell/`
- **Target file:** `assets/the-cryo-pelagic-cell-modal-feature.webm`
- **Where it lands:** inside the focus-trapped dialog opened from the poster tile.
  It plays large and deliberately, so this one can be the most cinematic of the batch.
- **Brand:** neuromuscular decompression and hyper-saline cold recovery, built with
  Shetland salmon-farm divers and Norwegian naval physiotherapists.

```text
Hyper-saline cold immersion tank in a clinical room inside a converted concrete
coastal bunker: dense brine water in a large stainless tank, cold vapour lying flat
on the surface, a slow descending gantry cable disturbing the water and sending
rings outward, frost on the tank rail, monitoring equipment out of focus behind.
Camera: 35mm, shot from the gantry looking down at a slight angle, slow descent move.
Lighting: hard cold white from overhead clinical fittings, deep blue-black shadow
in the concrete beyond.
Palette: near-black navy hsl(212,34%,15%), brine grey-green, steel, one cyan
instrument glow hsl(180,85%,45%).
Motion: vapour drift plus the expanding ring on the water. Must loop seamlessly.
Negatives: no on-screen text, no logos, no people, no recognisable faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 9. k-92-maritime-victualling — split panel

- **Site:** `sites/2026-08/k-92-maritime-victualling/`
- **Target file:** `assets/k-92-maritime-victualling-split-panel.webm`
- **Where it lands:** the panel pinned beside the scrolling provision manifest,
  revealed by the scroll-driven clip-path wipe
- **Brand:** koji-fermented pelagic nutrition for zero-spoilage maritime deployment,
  dispatched from the Fraserburgh harbour depot.

```text
Dockside dispatch depot on a north-east Scottish fishing harbour at first light:
sealed aluminium provision canisters staged in rows on a wet concrete quay, a
harbour crane arm moving slowly across the background, gulls, rain haze over the
water and moored trawler hulls behind.
Camera: 35mm, slow lateral dolly left to right along the staged rows.
Lighting: cold blue pre-dawn ambient with one sodium quay lamp warm in frame.
Palette: gunmetal and wet concrete greys, deep navy hsl(215,28%,15%), brushed
aluminium, one amber quay-lamp note hsl(42,94%,48%).
Motion: the dolly move plus the crane and rain haze. Must loop seamlessly.
Negatives: no on-screen text, no legible vessel names, no logos, no recognisable
faces, no watermarks.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

### 10. the-fenland-yeast-guild — footer ambient

- **Site:** `sites/2026-08/the-fenland-yeast-guild/`
- **Target file:** `assets/the-fenland-yeast-guild-footer-ambient.webm`
- **Where it lands:** behind the footer, at 40% opacity under a heavy scrim.
  It must stay **low-contrast and slow** - footer links sit on top of it.
- **Brand:** wild yeast captured in open coolships during three-night autumn fog
  windows in the Cambridgeshire black fens.

```text
Open coolship capturing wild yeast on a fen night: a wide shallow copper vessel of
steaming wort standing outdoors, dense low ground fog rolling across black peat
fields and over the vessel rim, reed beds silhouetted at the edge of frame.
Camera: 35mm, static locked-off wide, no camera move.
Lighting: moonlight only - very low key, no hard highlights anywhere in frame.
Palette: near-black fen green hsl(148,28%,18%), cold grey fog, dull copper,
one faint pale-yellow lantern hsl(48,94%,55%) far in the background.
Motion: fog drift and slow steam only - nothing fast, nothing bright.
Must loop seamlessly.
Negatives: no on-screen text, no logos, no recognisable faces, no watermarks,
no bright light sources, no lens flare.
Duration: 5-8s, seamless loop. Resolution: 720p. Aspect ratio: 16:9.
```

---

## Delivered

_Nothing yet. Prompts move here once the clip is installed and the site ships._
