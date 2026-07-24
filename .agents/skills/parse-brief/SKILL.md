---
name: parse-brief
description: Parses a pasted Gemini website brief into a structured build checklist (brand, slug, audience, tone, pages, layout family, copy ceilings, handoff). Use when the user pastes a website brief, creative brief, brand brief, daily site brief, or a document starting with "# Website Build Brief —", or at the start of the auto-detect build pipeline.
---

# Parse brief

## Goal

Turn free-form or structured brief text into a compact checklist consumed by `research-and-plan`, `scaffold-site`, `design-and-build`, and `acquire-images`.

## Recognise briefs

Canonical output starts with:

```text
# Website Build Brief — <Brand Name> — <YYYY-MM-DD>
```

Often followed by an HTML comment `<!-- VARIETY ENGINE AUDIT ... -->`. That block is **operator-only** (Dennis) — **ignore it entirely** for the build checklist; it is not a build instruction.

**Sections (prefer when present):**

1. Business Profile (+ brand voice card, tone)  
2. Repo Integration  
3. Scope & Sitemap (architecture, layout family + structural signature, word floor/ceiling, L/R split note)  
4. Copy — Split Load (4a Gemini verbatim; 4b builder directed; 4c rules)  
5. Colour Palette  
6. Typography, Layout & Motion (signature + forbidden + hard cap)  
7. Asset Specs  
8. Definition of Done  
9. Build Constraints  
10. **Antigravity Handoff** (or Builder Handoff) — research, planning, skills, image gen

Still accept older briefs without §10.

**Pipeline authority:** If brief §2 / §8 omit newer gates (`check:contract`, `check:ship`, `layoutFamily`, `wordFloor`, slug-scoped optimize), follow @AGENTS.md — AGENTS wins over thinner brief §2/§8.

## Extract

| Field | Notes |
|-------|--------|
| Brand name | Required — from title line or §1 |
| Slug | kebab-case from §1 or brand; unique under `sites/` |
| Tone | From §1 / voice card |
| Voice card | Do/don’t, reading level, rhythm |
| Blurb | Hub one-liner |
| Architecture | landing / dense one-pager / multi-page + page files |
| Layout family | Exact name from §3/§6 — one of the **eleven** in @.agents/rules/01-site-v2-standard.md / `scripts/lib/layout-families.js` |
| Layout signature | Mandatory structural signature + forbidden pattern from §3/§6 (carry into design) |
| L/R split count | From §3/§6 — hard cap ≤1 site-wide (sticky-rail is the special two-pane case) |
| Word floor / ceiling | From §3 |
| Verbatim copy | §4a only — hero + exactly one flagship; use exactly |
| Directed sections | §4b — builder authors within min/max |
| Motion ideas | §6 |
| CTAs | Primary / secondary |
| Locale | Default `en-GB` |
| Image specs | §7 + §10 image briefs |
| Handoff | §10 research angles, risks, skill order |

## Procedure

1. Read the full user message as the brief.
2. Strip / disregard any `VARIETY ENGINE AUDIT` HTML comment.
3. If `# Website Build Brief — …`, parse Brand and date, then walk §§1–10.
4. **Repo scan (mandatory):** Read every `sites/*/meta.json`. Emit: all existing slugs, titles, and layout families (if present). Flag **slug collision** if `sites/<slug>/` exists. Flag **near-duplicate brands** (normalize titles — same core words or obvious variant). **Block silent overwrite** — if slug exists, note for `scaffold-site` (upgrade in place or new slug; never overwrite without consent).
5. Derive kebab `slug` from §1 or brand; confirm uniqueness against the repo scan.
6. Emit internal checklist. Preserve §4a verbatim. Do not invent pages beyond §3.
7. If brand name or core concept missing, ask **one** question; otherwise continue.

## Output shape (example)

```text
Brand: …
Slug: …
Date: …
Repo scan: N existing sites; slug available / COLLISION
Near-duplicates: none / flagged: …
Tone: sharp industrial
Architecture: dense one-pager
Layout family: diagonal-cut
Layout signature: (one-line from §3/§6)
L/R splits allowed: 0 or 1
Word range: 1100–1450
Verbatim: hero + 1 flagship (§4a)
Directed: N sections (§4b) for builder
Handoff: §10 present (Antigravity Handoff or Builder Handoff)
Images: hero.webp (generate), …
```

Then hand off to `research-and-plan`.
