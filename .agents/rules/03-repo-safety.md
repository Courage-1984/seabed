---
trigger: always_on
description: Repo safety — off-limits paths, no nested scaffolds, secrets, git and deploy constraints
---

# Repo safety

## Never write or commit

- `node_modules/`, `dist/`, `.env`, credentials, API keys
- Secrets in site HTML or JS

## Site isolation

- Do not create nested Vite/React apps inside `sites/<slug>/`.
- Do not delete or rewrite unrelated sites while shipping a new brief.
- Prefer additive changes; upgrade in place only when asked or when resolving a slug collision with user consent.

## Git and deploy

- Do not `git commit` or `git push` unless the user explicitly asks.
- Do not amend shared history, force-push, or skip hooks unless explicitly requested.
- Deploy happens via GitHub Actions on push to `main` — do not change `.github/workflows/deploy.yml` unless fixing a real deploy break and the user wants that.

## Generated / local noise

- Prefer not to commit `qa-screenshots/` or `qa-visual/` (gitignored).
- `qa-report.json` may update during QA; include it in commits only if the user wants QA artifacts tracked.
