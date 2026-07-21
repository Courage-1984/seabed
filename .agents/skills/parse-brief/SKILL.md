---
name: parse-brief
description: Parses a pasted Gemini website brief into a structured build checklist (brand, slug, audience, tone, pages, layout family, copy ceilings, handoff). Use when the user pastes a website brief, creative brief, brand brief, daily site brief, or a document starting with "# Website Build Brief —", or at the start of the auto-detect build pipeline.
---

# Parse brief

## Goal

Turn free-form or structured brief text into a compact checklist consumed by `research-and-plan`, `scaffold-site`, `design-and-build`, and `acquire-images`.

## Recognise v3/v4 briefs

Canonical output starts with:

```text
# Website Build Brief — <Brand Name> — <YYYY-MM-DD>
```

**v4 sections (prefer when present):**

1. Business Profile (+ brand voice card, tone)  
2. Repo Integration  
3. Scope & Sitemap (architecture, layout family, word floor/ceiling)  
4. Copy — Split Load (4a Gemini verbatim; 4b Antigravity directed; 4c rules)  
5. Colour Palette  
6. Typography, Layout & Motion  
7. Asset Specs  
8. Definition of Done  
9. Build Constraints  
10. Antigravity Handoff (research, planning, skills, image gen)

Still accept older briefs without §10.

## Extract

| Field | Notes |
|-------|--------|
| Brand name | Required — from title line or §1 |
| Slug | kebab-case from §1 or brand; unique under `sites/` |
| Tone | From §1 / voice card |
| Voice card | Do/don’t, reading level, rhythm |
| Blurb | Hub one-liner |
| Architecture | landing / dense one-pager / multi-page + page files |
| Layout family | From §3/§6 (asymmetric split, bento, etc.) |
| Word floor / ceiling | From §3 |
| Verbatim copy | §4a only — hero + exactly one flagship; use exactly |
| Directed sections | §4b — Antigravity authors within min/max |
| Motion ideas | §6 |
| CTAs | Primary / secondary |
| Locale | Default `en-GB` |
| Image specs | §7 + §10 image briefs |
| Handoff | §10 research angles, risks, skill order |

## Procedure

1. Read the full user message as the brief.
2. If `# Website Build Brief — …`, parse Brand and date, then walk §§1–10.
3. **Repo scan (mandatory):** Read every `sites/*/meta.json`. Emit: all existing slugs, titles, and layout families (if present). Flag **slug collision** if `sites/<slug>/` exists. Flag **near-duplicate brands** (normalize titles — same core words or obvious variant). **Block silent overwrite** — if slug exists, note for `scaffold-site` (upgrade in place or new slug; never overwrite without consent).
4. Derive kebab `slug` from §1 or brand; confirm uniqueness against the repo scan.
5. Emit internal checklist. Preserve §4a verbatim. Do not invent pages beyond §3.
6. If brand name or core concept missing, ask **one** question; otherwise continue.

## Output shape (example)

```text
Brand: …
Slug: …
Date: …
Repo scan: N existing sites; slug available / COLLISION
Near-duplicates: none / flagged: …
Tone: sharp industrial
Architecture: dense one-pager
Layout family: bento
Word range: 1100–1450
Verbatim: hero + 1 flagship (§4a)
Directed: N sections (§4b) for Antigravity
Handoff: §10 present
Images: hero.webp (generate), …
```

Then hand off to `research-and-plan`.
