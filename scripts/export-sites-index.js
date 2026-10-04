#!/usr/bin/env node
/**
 * Regenerates .agents/prompts/_sites-index.md from sites meta.json files.
 * Operator pastes sections into the external Gemini brief prompt (~weekly).
 *
 * Gemini cannot know what it built last week, so everything it needs is
 * computed here (scripts/lib/rotation.js) and pasted in:
 *   - Rotation schedule: the next 14 days, every value pre-rolled. Rows ban each
 *     other, so a weekly paste can no longer repeat itself mid-week. Gemini looks
 *     up today's date and uses the row verbatim.
 *   - Anti-repetition state: the bans as of today, for the fallback path.
 *   - Existing sites: collision reference, now with style family, palette and fonts.
 */
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadHistory,
  buildSchedule,
  bannedFonts,
  styleCycle,
  WINDOWS,
  STYLE_CYCLE,
  ROTATION_CUTOFF,
  addDays,
  todayUtc,
} from './lib/rotation.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '.agents/prompts/_sites-index.md');
const SCHEDULE_DAYS = 14;

/** Pipes in a title would break the markdown table. */
const cell = (v) =>
  String(v ?? '—')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim() || '—';

const records = loadHistory(ROOT);
const today = todayUtc();
/** Rows before the cutoff would sit outside the style rotation, so the schedule never starts earlier. */
const scheduleStart = today < ROTATION_CUTOFF ? ROTATION_CUTOFF : today;
const schedule = buildSchedule(scheduleStart, SCHEDULE_DAYS, records);

const rows = records.map(
  (r) =>
    `| ${cell(r.slug)} | ${cell(r.title)} | ${cell(r.layoutFamily)} | ${cell(r.styleFamily)} | ${cell(r.palette?.signature)} | ${cell(r.fonts.join(' + '))} | ${cell(r.videoPlacement)} | ${cell(r.signatureEffect)} | ${cell(r.created)} |`
);

const scheduleRows = schedule.map(
  (r) =>
    `| ${r.date} | ${cell(r.architecture)} | ${cell(r.layoutFamily)} | ${cell(r.styleFamily)} | ${cell(r.fonts.join(' + '))} | ${cell(r.videoPlacement)} | ${cell(r.signatureEffect)} | ${cell(r.sector)} | ${cell(r.tone)} | ${cell(r.twistAxis)} | ${cell(r.namingStyle)} |`
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

const bannedLayouts = recent('layoutFamily', WINDOWS.layout);
const bannedPlacements = recent('videoPlacement', WINDOWS.placement);
const bannedEffects = recent('signatureEffect', WINDOWS.effect);
const styleState = styleCycle(records);
const recentStyles = new Set(records.slice(0, WINDOWS.style).map((r) => r.styleFamily));
const bannedStyles = [...new Set([...styleState.used, ...recentStyles])].filter(Boolean);
const nextStyles = styleState.remaining.filter((f) => !recentStyles.has(f));
const plannedStyles = styleState.remaining.map((f) =>
  recentStyles.has(f) ? `${f} (not yet: used in the last ${WINDOWS.style})` : f
);
const fonts = bannedFonts(records);
const withPalette = records.filter((r) => r.palette);
const recentBases = [...new Set(withPalette.slice(0, WINDOWS.paletteBase).map((r) => r.palette.base))];
const recentSignatures = [...new Set(withPalette.slice(0, WINDOWS.paletteSignature).map((r) => r.palette.signature))];

const freqWindow = records.slice(0, WINDOWS.layoutCap.window);
const freq = new Map();
for (const r of freqWindow) {
  if (!r.layoutFamily) continue;
  freq.set(r.layoutFamily, (freq.get(r.layoutFamily) ?? 0) + 1);
}
const freqCap = WINDOWS.layoutCap.max;
const overCap = [...freq.entries()].filter(([, n]) => n >= freqCap).map(([k, n]) => `${k} (${n})`);
const usageLines = [...freq.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([k, n]) => `${k}: ${n}${n >= freqCap ? '  <-- AT CAP' : ''}`);

/** Arrays or Sets. */
const list = (values) => {
  const arr = [...values];
  return arr.length ? arr.join(', ') : '(none recorded yet)';
};

const slugs = records.map((r) => r.slug).sort();
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

const validThrough = addDays(scheduleStart, SCHEDULE_DAYS - 1);

const md = `<!-- GENERATED — paste sections below into your external Gemini brief prompt (~weekly).
     Regenerate: npm run sites:index
     Cadence: manual-weekly (see audit/STATUS.md). The schedule covers ${SCHEDULE_DAYS} days, so a weekly
     paste always has a week of runway. -->

## Rotation schedule (paste into STEP 0)

Generated ${today} from ${records.length} sites. Valid ${scheduleStart} through ${validThrough}.
Style families rotate in equal cycles of ${STYLE_CYCLE}: each run of ${STYLE_CYCLE} sites uses every family exactly once, in random order.
Find today's UTC date and use that row **verbatim**. Rows already ban each other and every recent site.

| date | architecture | layout family | style family | fonts (heading + body) | video placement | signature effect | sector | tone | twist axis | naming style |
|------|--------------|---------------|--------------|------------------------|-----------------|------------------|--------|------|------------|--------------|
${scheduleRows.join('\n')}

## Anti-repetition state (paste into STEP 0)

Computed ${today} from the ${records.length} sites below, newest first. Used only when today's date is not in the schedule.

\`\`\`text
BANNED layout families (used in the last ${WINDOWS.layout} sites):
${list(bannedLayouts)}

Style rotation: cycle ${styleState.cycle + 1}, ${styleState.position}/${STYLE_CYCLE} built. Every ${STYLE_CYCLE} sites use all ${STYLE_CYCLE} families once.
Still to come this cycle, in planned order. Take the first one that is not marked "not yet":
${list(plannedStyles)}

BANNED style families (used this cycle, or in the last ${WINDOWS.style} sites):
${list(bannedStyles)}

BANNED video placements (used in the last ${WINDOWS.placement} sites):
${list(bannedPlacements)}

BANNED signature effects (used in the last ${WINDOWS.effect} sites):
${list(bannedEffects)}

BANNED fonts (used in the last ${WINDOWS.font} sites):
${list(fonts.recent)}

BANNED fonts (overused: ${WINDOWS.fontOveruse.max + 1}+ of the last ${WINDOWS.fontOveruse.window} sites):
${list(fonts.overused)}

Recent palette bases (ground|primary, last ${WINDOWS.paletteBase}) — do not reproduce:
${list(recentBases)}

Recent palette signatures (ground|primary|accent, last ${WINDOWS.paletteSignature}) — do not reproduce:
${list(recentSignatures)}

Layout usage, last ${freqWindow.length} sites (frequency cap: max ${freqCap}):
${usageLines.length ? usageLines.join('\n') : '(none recorded yet)'}
${overCap.length ? `\nAT CAP — also banned: ${overCap.join(', ')}` : ''}
\`\`\`

## Existing sites (collision reference)

| slug | title | layout-family | style-family | palette | fonts | video-placement | signature-effect | created |
|------|-------|---------------|--------------|---------|-------|-----------------|------------------|---------|
${rows.join('\n')}

## Roster (paste into brief prompt)

Replace the fenced slug list in your external Variety Engine **Roster** section with:
\`\`\`
${rosterLines.join('\n')}
\`\`\`
`;

await writeFile(OUT, md, 'utf8');
console.log(`Wrote ${rows.length} sites + ${SCHEDULE_DAYS}-day schedule → ${OUT.replace(/\\/g, '/')}`);
console.log(`  schedule:          ${scheduleStart} → ${validThrough}`);
console.log(
  `  style cycle:       ${styleState.cycle + 1}, ${styleState.position}/${STYLE_CYCLE} built; next: ${nextStyles[0] ?? '-'}`
);
console.log(`  banned layouts:    ${list(bannedLayouts)}`);
console.log(`  banned styles:     ${list(bannedStyles)}`);
console.log(`  banned placements: ${list(bannedPlacements)}`);
console.log(`  banned effects:    ${list(bannedEffects)}`);
console.log(`  banned fonts:      ${list(fonts.all)}`);
if (overCap.length) console.log(`  at frequency cap:  ${overCap.join(', ')}`);
