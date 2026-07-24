---
name: research-and-plan
description: Executes the brief section Builder Handoff (§10) research and planning before scaffolding — gathers realism notes, risks, and a build checklist. Use after parse-brief when a Website Build Brief includes section 10 handoff (Builder Handoff or Antigravity Handoff), research angles, or planning checklist.
---

# Research and plan

## Goal

Run a **short** research-and-planning pass from brief §10 (**Builder Handoff** / legacy **Antigravity Handoff**) before creating files. Improve directed copy realism and reduce build risks. Do not spiral into open-ended research.

## Preconditions

- Checklist from `parse-brief` (brand, slug, tone, architecture, layout family).
- Prefer §10 content when present; if missing (older brief), invent a minimal 3-bullet research list + risk list from §1/§3/§7.

## Codebase awareness (mandatory)

1. Use the repo scan from `parse-brief` (existing slugs, titles, layout families).
2. If slug collision or near-duplicate brand flagged, carry into planning risks and confirm user intent before `scaffold-site`.
3. Add §10 research angle: compare niche to existing `sites/**` — avoid layout clone and trope repeat.

## Research (bounded)

1. Read §10 Research angles (or derive 3–5 from the niche).
2. Optionally look up public facts that inform **fiction** (materials, regional climate, industry jargon, safety norms). Do **not** copy real trademarks or unique living-company claims.
3. Write a short internal note (5–10 bullets max): realism anchors + tropes to avoid.
4. Time-box: enough for better copy, not a report.

## Planning

1. Confirm skill order per @AGENTS.md (full pipeline).
2. List risks from §10 (overflow, thin FAQ, generic hero, copy ceiling, WebP, slug/layout collision, **collapsing into a generic repeating two-column layout instead of the declared layout family’s mandatory signature**).
3. Note layout family + architecture + structural signature so design-and-build does not invent a different structure.
4. Note image prefs (`pd-open` vs `generate`) for acquire-images.

## Output

Keep notes in working memory / a brief scratch list. Do not create a long markdown file in the repo unless the user asks.

## Next

Hand off to `scaffold-site`.
