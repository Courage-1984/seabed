#!/usr/bin/env node
/**
 * Regenerates .agents/prompts/_sites-index.md from sites meta.json files.
 * Operator pastes sections into the external Gemini brief prompt (~weekly).
 *
 * The "Anti-repetition state" block is what makes the Variety Engine's
 * hard-ban rules mechanically checkable: Gemini cannot know what it built
 * last week, so the bans are computed here and pasted in.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findAllSiteDirs } from './lib/resolve-slug.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '.agents/prompts/_sites-index.md');

/** Windows used by the Variety Engine guardrails. Keep in sync with the brief prompt. */
const LAYOUT_BAN_WINDOW = 8;
const LAYOUT_FREQ_WINDOW = 25;
const LAYOUT_FREQ_MAX_PCT = 20;
const PLACEMENT_BAN_WINDOW = 8;
const EFFECT_BAN_WINDOW = 12;

/** Pipes in a title would break the markdown table. */
const cell = (v) =>
  String(v ?? '—')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim() || '—';

const allSites = findAllSiteDirs(ROOT);
const slugs = allSites.map((s) => s.slug).sort();

const records = [];
for (const site of allSites) {
  const { slug, absolutePath } = site;
  try {
    const meta = JSON.parse(await readFile(join(absolutePath, 'meta.json'), 'utf8'));
    records.push({
      slug,
      title: meta.title,
      layout: meta.layoutFamily ?? meta.layout,
      placement: meta.videoPlacement,
      effect: meta.signatureEffect,
      created: meta.created,
    });
  } catch {
    records.push({ slug });
  }
}

// Newest first — recency is the whole point of this file.
records.sort((a, b) => String(b.created ?? '').localeCompare(String(a.created ?? '')) || a.slug.localeCompare(b.slug));

const rows = records.map(
  (r) =>
    `| ${cell(r.slug)} | ${cell(r.title)} | ${cell(r.layout)} | ${cell(r.placement)} | ${cell(r.effect)} | ${cell(r.created)} |`
);

// --- anti-repetition state ---------------------------------------------------
const recent = (field, n) => [
  ...new Set(
    records
      .slice(0, n)
      .map((r) => r[field])
      .filter(Boolean)
  ),
];

const bannedLayouts = recent('layout', LAYOUT_BAN_WINDOW);
const bannedPlacements = recent('placement', PLACEMENT_BAN_WINDOW);
const bannedEffects = recent('effect', EFFECT_BAN_WINDOW);

const freqWindow = records.slice(0, LAYOUT_FREQ_WINDOW);
const freq = new Map();
for (const r of freqWindow) {
  if (!r.layout) continue;
  freq.set(r.layout, (freq.get(r.layout) ?? 0) + 1);
}
const freqCap = Math.floor((LAYOUT_FREQ_MAX_PCT / 100) * freqWindow.length);
const overCap = [...freq.entries()].filter(([, n]) => n > freqCap).map(([k, n]) => `${k} (${n})`);
const usageLines = [...freq.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([k, n]) => `${k}: ${n}${n > freqCap ? '  <-- OVER CAP' : ''}`);

const list = (arr) => (arr.length ? arr.join(', ') : '(none recorded yet)');

const rosterLines = [];
let line = '';
for (const slug of slugs) {
  const piece = line ? `, ${slug}` : slug;
  if (line && (line + piece).length > 88) {
    rosterLines.push(line + ',');
    line = slug;
  } else {
    line += piece;
  }
}
if (line) rosterLines.push(line);

const md = `<!-- GENERATED — paste sections below into your external Gemini brief prompt (~weekly).
     Regenerate: npm run sites:index
     Cadence: manual-weekly (see audit/STATUS.md) -->

## Anti-repetition state (paste into STEP 0)

Computed from the ${records.length} sites below, newest first.

\`\`\`text
BANNED layout families (used in the last ${LAYOUT_BAN_WINDOW} sites):
${list(bannedLayouts)}

BANNED video placements (used in the last ${PLACEMENT_BAN_WINDOW} sites):
${list(bannedPlacements)}

BANNED signature effects (used in the last ${EFFECT_BAN_WINDOW} sites):
${list(bannedEffects)}

Layout usage, last ${freqWindow.length} sites (frequency cap: max ${freqCap} = ${LAYOUT_FREQ_MAX_PCT}%):
${usageLines.length ? usageLines.join('\n') : '(none recorded yet)'}
${overCap.length ? `\nOVER CAP — also banned: ${overCap.join(', ')}` : ''}
\`\`\`

## Existing sites (collision reference)

| slug | title | layout-family | video-placement | signature-effect | created |
|------|-------|---------------|-----------------|------------------|---------|
${rows.join('\n')}

## Roster (paste into brief prompt)

Replace the fenced slug list in your external Variety Engine **Roster** section with:
\`\`\`
${rosterLines.join('\n')}
\`\`\`
`;

await writeFile(OUT, md, 'utf8');
console.log(`Wrote ${rows.length} sites → ${OUT.replace(/\\/g, '/')}`);
console.log(`  banned layouts:    ${list(bannedLayouts)}`);
console.log(`  banned placements: ${list(bannedPlacements)}`);
console.log(`  banned effects:    ${list(bannedEffects)}`);
if (overCap.length) console.log(`  over frequency cap: ${overCap.join(', ')}`);
