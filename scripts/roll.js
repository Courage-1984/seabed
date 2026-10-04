#!/usr/bin/env node
/**
 * Roll the Variety Engine from real history.
 *
 * Usage:
 *   node scripts/roll.js                      today's roll (UTC)
 *   node scripts/roll.js --date 2026-10-05    a given date
 *   node scripts/roll.js --days 14            a schedule; rows ban each other
 *   node scripts/roll.js --for <slug>         re-roll for an existing site: its created
 *                                             date, judged against the sites before it
 *   --json                                    machine-readable output
 *
 * The builder uses --for when a brief's values fail check:variety. The operator
 * uses it to sanity-check what sites:index will publish.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSlugPath } from './lib/resolve-slug.js';
import { loadHistory, rollDay, buildSchedule, todayUtc } from './lib/rotation.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let date = null;
let days = 1;
let forSlug = null;
let json = false;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--date') date = argv[++i];
  else if (a === '--days') days = Number(argv[++i]);
  else if (a === '--for') forSlug = argv[++i];
  else if (a === '--json') json = true;
  else {
    console.error(`Unknown arg: ${a}`);
    process.exit(2);
  }
}
if ((date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) || !Number.isInteger(days) || days < 1) {
  console.error('Usage: node scripts/roll.js [--date YYYY-MM-DD] [--days N] [--for <slug>] [--json]');
  process.exit(2);
}

let excludeSlug = null;
if (forSlug) {
  const site = resolveSlugPath(ROOT, forSlug);
  if (!site) {
    console.error(`site "${forSlug}" not found across ./sites/`);
    process.exit(1);
  }
  const meta = JSON.parse(readFileSync(join(site.absolutePath, 'meta.json'), 'utf8'));
  date = date ?? meta.created;
  excludeSlug = site.slug;
}
date = date ?? todayUtc();

const history = loadHistory(ROOT, { beforeDate: date, excludeSlug });
const rows = days === 1 ? [rollDay(date, history)] : buildSchedule(date, days, history);

if (json) {
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

for (const r of rows) {
  console.log(`${r.date}${r.nth > 1 ? `  (site #${r.nth} that day)` : ''}`);
  console.log(`  architecture     ${r.architecture}`);
  console.log(`  layout family    ${r.layoutFamily}`);
  console.log(`  style family     ${r.styleFamily}`);
  console.log(`  fonts            ${r.fonts.join(' + ')}`);
  console.log(`  video placement  ${r.videoPlacement}`);
  console.log(`  signature effect ${r.signatureEffect}`);
  console.log(`  sector           ${r.sector}`);
  console.log(`  tone             ${r.tone}`);
  console.log(`  twist axis       ${r.twistAxis}`);
  console.log(`  naming style     ${r.namingStyle}`);
  if (r.fallbacks.length) console.log(`  fallback used    ${r.fallbacks.join(', ')} (every candidate was banned)`);
}
console.log(
  `\n(judged against ${history.length} sites created on or before ${date}${excludeSlug ? `, excluding ${excludeSlug}` : ''})`
);
