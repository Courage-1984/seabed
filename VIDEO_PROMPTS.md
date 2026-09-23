# Video generation queue

The queue is empty — every site has its clip. This file stays as the record of
what shipped and, at the top, the rules that were learned the expensive way.

When there is something to generate: one prompt per site in Google Flow, download
it, drop it in `./videos_new/`, and say "the videos are in". The agent reviews two
frames of each clip **before** encoding — a bad clip is far cheaper to reject than
to install and pull back out.

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

**Coverage: 88 of 88. Every site has its clip installed, wired and reviewed**, and
the queue is empty. Each clip has been looked at on two frames, not just checked
for existing.

---

## Accepted with a note

`lithic-resonance` came back as an English moorland granite tor under moving
cloud. The site casts its diffusers from repurposed Johannesburg mine tailings,
so the geology and the green grass are both wrong for the brand. It is kept
because the slot is a hero background: decorative, aria-hidden, and sitting under
a heavy scrim where it reads as stone mass rather than as a place. Worth
regenerating if the queue is ever idle; not worth a slot in this batch.

`abyssal-data-recovery`'s replacement has a short marking on the yellow probe
handle where the prompt asked for a blank one. It reads as an unremarkable tool
brand rather than leaked prompt text, and it is nothing like the `#eab308` that
got the first attempt rejected. Kept.

---

## Delivered

The 10 replacement clips generated on 2026-09-23 are installed and wired. They
replaced the ten rejected on review: two whose prompt had been written from the
slug instead of the site, one that contradicted the caption printed beside it,
and seven with a CSS colour value rendered into the frame. All ten replacements
were reviewed on two frames each **before** encoding, which is the order this
queue works in from now on.

The 46 clips generated on 2026-09-19 (batches 6, 7 and 8) are installed and wired.
The 28 clips generated on 2026-09-11, 2026-09-12 and 2026-09-13 are installed, wired into their slot, and
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
