# Governance status

**Branch context:** `chore/governance-dedup` and follow-ups  
**Full audit text (historical):** `git show 99dd64f:audit/GT-AUD-GOV-20260721.md` and `git show 99dd64f:audit/CHANGELOG-GT-AUD-GOV-20260721.md`  
**Sites index cadence:** manual-weekly — `npm run sites:index`, paste into Gemini Scheduled Action

## Decisions in effect

```
MODEL:               split (GEMINI.md producer / AGENTS.md builder)
GEMINI_REPO_ACCESS:  sites index paste (B+C)
MCP_CONFIG:          keep-empty-documented
HOOKS_JSON:          lightweight (warn-only)
PLUGIN_JSON:         skip — workspace-native `.agents/` is SOT; portable plugins would be `.agents/plugins/<name>/` if ever needed
COPY_GATE:           fail-qa-10pct (check-copy-depth + check:ship + qa-and-ship)
CONTRACT_GATE:       check:contract (static) + qa_sweep (runtime)
CURSOR_DOC:          document (no `.cursor/rules` symlink)
SITES_INDEX_CADENCE: manual-weekly
```

## Applied (Phase 1–4 + residual close)

| Area | Status |
|------|--------|
| Producer/builder split (`GEMINI.md` / `AGENTS.md`) | Applied |
| `@` dedup to canonical owners | Applied |
| Sites index + `layoutFamily` in meta + export | Applied |
| Copy-depth script + QA skill gate | Applied |
| WebP `nonWebpPhotos` in `scripts/qa_sweep.js` | Applied |
| Hooks warn on qa:v2-pass / non-WebP img | Applied; overflow field fixed to `overflowingElements` |
| `.gemini/settings.json` | Applied |
| Cursor documented as alternate builder | Applied |
| png/jpeg→webp typo lines | Fixed |
| AGENTS pipeline includes copy-depth | Applied |
| `/upgrade-site-v2` marked legacy-only | Applied |
| §10 renamed Builder Handoff (legacy Antigravity Handoff accepted) | Applied |
| Static `check:contract` + `check:ship` + qa_sweep summary report | Applied |
| Optimize/copy-depth `--slug` / optional `meta.wordFloor` | Applied |
| 11 layout families + structural-signature builder rules | Applied |
| External brief prompt snapshot + roster paste from `sites:index` | Applied |
| Hub discovery strip + `meta.created` (required) + latest-drop stage | Applied |

## Residual / deferred (intentional)

| Item | Reason |
|------|--------|
| Portable `.agents/plugins/<name>/` bundle | Single-repo; workspace `.agents/` is enough |
| `.cursor/rules/` symlink | `CURSOR_DOC: document` |
| Firecrawl (or other) MCP in `mcp_config.json` | Keep empty; image gen uses IDE built-ins |
| Hard-fail hooks | Warn-only; ship gates live in QA scripts + skills |
| Invent `wordFloor` for all legacy sites | Set at ship when brief floor is known |
