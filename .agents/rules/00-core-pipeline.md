---
trigger: always_on
description: Core Project Instructions — brief auto-detection and full site build pipeline
---

# Core pipeline

## When the user pastes a website brief

Treat messages that contain a structured or prose **website brief** (brand, concept, audience, tone, pages, visual direction, CTAs) as a build request — even if they never say “build”, “implement”, or use a slash command.

**Immediately** execute the full pipeline in `AGENTS.md`. Do not ask for confirmation unless the brand name or core concept is missing (then ask one question).

## Pipeline skills (in order)

1. `parse-brief`
2. `research-and-plan`
3. `scaffold-site`
4. `design-and-build`
5. `acquire-images`
6. Run `npm run optimize:webp` then `npm run optimize:html`
7. `qa-and-ship` (`npm run build` then `npm run qa`; confirm responsive PASS + WebP)

Mark `meta.json` with `"standard": "v2"` and `"qa": "v2-pass"` only after QA passes **and** responsive desktop + mobile PASS.

## Do not

- Wait for `/build-site` or similar (that workflow does not exist on purpose).
- Stop after scaffolding without designing, imaging, and QA.
- Commit or push unless the user asks.
