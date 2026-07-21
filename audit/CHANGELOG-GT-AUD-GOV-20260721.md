# CHANGELOG — GT-AUD-GOV-20260721

**Branch:** `chore/governance-dedup`  
**Runs:** Phase 1 (dedup) + Phase 2, 3, 4 (follow-up)  
**Date:** 2026-07-21  
**Status:** Edits applied; not committed (await operator request).

---

## Decisions in effect

```
BRANCH:              chore/governance-dedup
PHASES:              1 + 2,3,4 (follow-up)
MODEL:               split
GEMINI_REPO_ACCESS:  B+C
MCP_CONFIG:          keep-empty-documented
HOOKS_JSON:          lightweight
PLUGIN_JSON:         defer
COPY_GATE:           fail-qa-10pct
CURSOR_DOC:          document
SITES_INDEX_CADENCE: manual-weekly
APP_SOURCE_EDITS:    apply
NEW_SCRIPTS:         create
```

---

## Phase 1 — Stop drift (dedup)

| Path | Item | Before→after intent | Char Δ |
|------|------|---------------------|--------|
| `.agents/rules/00-core-pipeline.md` | P1.1 | Pipeline list → `@AGENTS.md` pointer | 1168 → 813 (−355) |
| `AGENTS.md` | P1.2 | Hub/off-limits → `@` rules; WebP/qa → skill owners | 2909 → ~2470 (−439) |
| `.agents/prompts/daily-brief-generator.md` | P1.3–P1.4 | §2/§6/§7/§8/§9 deduped to `@` owners | 13589 → ~11200 (−2389) |
| `.agents/rules/01-site-v2-standard.md` | P1.4 | qa gate → `@qa-and-ship` | −9 |
| `.agents/skills/acquire-images/SKILL.md` | P1.4–P1.5 | WebP owner; typo fix | +28 |
| `.agents/skills/qa-and-ship/SKILL.md` | P1.4 | Canonical gates retained | (superseded P2.3) |
| `.agents/skills/design-and-build/SKILL.md` | P1.4 | `@` rule refs | (superseded P2.3) |
| `.agents/skills/scaffold-site/SKILL.md` | P1.4 | en-GB + qa `@` refs | +50 |
| `.agents/skills/research-and-plan/SKILL.md` | P1.4 | Pipeline → `@AGENTS.md` | −35 |
| `GEMINI.md` | P1.4 | Fonts → `@02-frontend-design` | (superseded P3.2) |
| Workflows (×3) | P1.4–P1.5 | qa/commit `@` refs; typo fix | +187 combined |

---

## Phase 2 — Enforce pipeline goals

| Path | Item | Before→after intent | Char Δ |
|------|------|---------------------|--------|
| `.agents/skills/parse-brief/SKILL.md` | P2.1 | Mandatory `sites/*/meta.json` repo scan; collision + near-duplicate flags | ~2680 → ~3200 (+520) |
| `.agents/skills/research-and-plan/SKILL.md` | P2.1 | Codebase awareness section; collision risks | ~1665 → ~1950 (+285) |
| `.agents/prompts/daily-brief-generator.md` | P2.2 | STEP 0: consult Existing sites list; §10 collision risk | ~11200 → ~11450 (+250) |
| `.agents/prompts/_sites-index.md` | P2.2 | **NEW** generated slug · title · layout-family table (26 sites) | +~1200 (generated) |
| `scripts/export-sites-index.js` | P2.2 | **NEW** `npm run sites:index` regenerates index from meta.json | +~1100 |
| `.agents/skills/design-and-build/SKILL.md` | P2.3 | Pre-handoff word-count + section-min self-check; `check-copy-depth` gate | ~2500 → ~3100 (+600) |
| `.agents/skills/qa-and-ship/SKILL.md` | P2.3–P2.4 | Copy-depth step (fail-qa-10pct); WebP via `nonWebpPhotos` in report | ~2184 → ~2800 (+616) |
| `scripts/check-copy-depth.js` | P2.3 | **NEW** cheerio word count; fail below floor −10% | +~1200 |
| `qa_sweep.js` | P2.4 | `nonWebpPhotos` check per viewport; exit 1 on any QA failure | +~35 lines |
| `package.json` | P2.2–P2.3 | Added `sites:index`, `check:copy-depth` scripts | +2 entries |

---

## Phase 3 — Activation hygiene & structure

| Path | Item | Before→after intent | Char Δ |
|------|------|---------------------|--------|
| `.agents/rules/01-site-v2-standard.md` | P3.1 | `trigger: always_on` → `trigger: glob` / `sites/**` | 1491 → 1501 (+10) |
| `GEMINI.md` | P3.2 | Producer context + `@AGENTS.md` builder pointer; sites index + Cursor notes | 2185 → ~2900 (+715) |
| `AGENTS.md` | P3.2 | Builder SOT; new commands table rows | +~120 |
| `.gemini/settings.json` | P3.3 | **NEW** `{ "context": { "fileName": "GEMINI.md" } }` | +48 |

---

## Phase 4 — Optional hardening

| Path | Item | Before→after intent | Char Δ |
|------|------|---------------------|--------|
| `.agents/hooks.json` | P4.1 | **NEW** PostToolUse → `governance-post-edit.js` (lightweight warn) | +~200 |
| `.agents/hooks/governance-post-edit.js` | P4.1 | **NEW** warns on qa:v2-pass without clean report; non-WebP `<img>` | +~2800 |
| `.agents/mcp_config.json` | P4.3 | `_comment` documenting intentional empty servers | 23 → ~120 |
| `README.md` | P4.4 | Cursor alternate builder; sites:index cadence; hooks/index docs | +~400 |
| `.agents/plugin.json` | P4.2 | **Deferred** per `PLUGIN_JSON: defer` | — |

---

## `@`-mentions added (Phase 2–4)

| Mention | Used in |
|---------|---------|
| `@AGENTS.md` | `GEMINI.md` (builder pointer) |
| `@./.agents/prompts/_sites-index.md` | `GEMINI.md` |
| `scripts/check-copy-depth.js` | `design-and-build`, `qa-and-ship` |
| `nonWebpPhotos` | `qa-and-ship`, `qa_sweep.js`, hooks |

---

## Post-run verification

| Check | Result |
|-------|--------|
| Rules ≤ 12,000 chars | PASS (813–2185) |
| Workflows ≤ 12,000 chars | PASS (677–1094) |
| `@`-mentions resolve | PASS |
| Invariants preserved | PASS |
| `sites/**` untouched | PASS (read-only scan + index export only) |
| `vite.config.js` / `hub.js` untouched | PASS |
| App source applied | PASS — `qa_sweep.js`, `package.json`, `scripts/*` |
| `export-sites-index.js` runs | PASS — 26 sites written |
| `check-copy-depth.js` runs | PASS — `forge-and-feather` 1326 words ≥ 585 min |

---

## Proposals not applied

| Item | Reason |
|------|--------|
| `.agents/plugin.json` | `PLUGIN_JSON: defer` — create after governance stabilizes |
| `.cursor/rules/` symlink | `CURSOR_DOC: document` (not symlink) |
| Firecrawl MCP stub | `MCP_CONFIG: keep-empty-documented` |
| `post-merge-ci` sites index | `SITES_INDEX_CADENCE: manual-weekly` |
| `fail-hooks` copy gate | `COPY_GATE: fail-qa-10pct` (script + QA skill, not hooks) |

---

## Operator next steps

1. Review full diff on `chore/governance-dedup`.
2. Run `npm run sites:index` weekly; paste `_sites-index.md` into Gemini Scheduled Action.
3. Optional: run `npm run build && npm run qa` to confirm existing sites pass new WebP gate.
4. Request commit when satisfied.

---

## Machine gates now active

| Gate | Enforcement |
|------|-------------|
| WebP photos | `qa_sweep.js` → `nonWebpPhotos`; QA exits 1 on failure |
| Copy depth | `scripts/check-copy-depth.js`; required in `design-and-build` + `qa-and-ship` |
| qa:v2-pass / non-WebP img (advisory) | `.agents/hooks/governance-post-edit.js` warns on edit |
