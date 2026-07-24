---
trigger: always_on
description: Core Project Instructions — brief auto-detection and full site build pipeline
---

# Core pipeline

## When the user pastes a website brief

Treat messages that contain a structured or prose **website brief** (brand, concept, audience, tone, pages, visual direction, CTAs) as a build request — even if they never say “build”, “implement”, or use a slash command.

On a website brief → execute the pipeline defined in @AGENTS.md. Do not ask for confirmation unless the brand name or core concept is missing (then ask one question).

## Do not

- Wait for `/build-site` or similar (that workflow does not exist on purpose).
- Stop after scaffolding without designing, imaging, and QA.
- Commit or push unless the user asks — see @.agents/rules/03-repo-safety.md.
