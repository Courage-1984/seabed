#!/usr/bin/env node
/**
 * Verifies that the Extreme Visual Audit (AGENTS.md 14) actually happened.
 *
 * Usage: node scripts/check-vision-review.js <slug> [--write-stub]
 * Exit 0 = reviewed and current, 1 = fail, 2 = usage.
 *
 * Before this existed, "the agent looked at the screenshots" was enforced by
 * nothing whatsoever: ship-gate.js never read the visual report, a site with
 * zero tiles and no recording reached SHIP_PASS, and the only record that a
 * review had happened was the agent writing "qa": "v2-pass" into its own
 * meta.json. 51 of 89 sites have no tiles at all.
 *
 * The review is bound to a digest over (site source + every contact sheet),
 * so it cannot outlive what it approved. Change a stylesheet, or re-run
 * qa:visual, and the review goes stale and must be redone. That is the point:
 * a review of an older build is not a review of this one.
 */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSlugPath } from './lib/resolve-slug.js';
import { siteSourceDigest, shortDigest } from './lib/source-digest.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REVIEW_DIR = join(ROOT, 'audit', 'visual-reviews');

function usage() {
  console.error('Usage: node scripts/check-vision-review.js <slug> [--write-stub]');
  process.exit(2);
}

const argv = process.argv.slice(2);
const writeStub = argv.includes('--write-stub');
const slug = argv.find((a) => !a.startsWith('--'));
if (!slug) usage();

const site = resolveSlugPath(ROOT, slug);
if (!site) {
  console.error(`VISION_FAIL: site "${slug}" not found across ./sites/`);
  process.exit(1);
}

const manifestPath = join(ROOT, 'qa-screenshots', site.slug, 'MANIFEST.json');
if (!existsSync(manifestPath)) {
  console.error(
    `VISION_FAIL: no visual-QA evidence for ${site.slug} — run: npm run qa:visual -- ${site.slug}`
  );
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch {
  console.error(`VISION_FAIL: ${manifestPath} is not valid JSON — re-run npm run qa:visual -- ${site.slug}`);
  process.exit(1);
}

if (!manifest.sheets?.length) {
  console.error(
    `VISION_FAIL: ${site.slug} has a manifest with no contact sheets — there is nothing to review.\n` +
      `  Re-run without --no-sheets/--no-tiles: npm run qa:visual -- ${site.slug}`
  );
  process.exit(1);
}

// Recompute the rollup from what is on disk right now, rather than trusting
// the number the manifest recorded when it was written.
const currentSource = siteSourceDigest(site.absolutePath);
const rollup = createHash('sha256');
rollup.update(currentSource);
const missing = [];
for (const sheet of manifest.sheets) {
  const abs = join(ROOT, sheet.path);
  if (!existsSync(abs)) {
    missing.push(sheet.path);
    continue;
  }
  rollup.update(`${sheet.path}\0${createHash('sha256').update(readFileSync(abs)).digest('hex')}\0`);
}
if (missing.length) {
  console.error(`VISION_FAIL: ${missing.length} contact sheet(s) listed in the manifest are gone:`);
  for (const m of missing) console.error(`  ${m}`);
  console.error(`  Re-run: npm run qa:visual -- ${site.slug}`);
  process.exit(1);
}
const currentDigest = rollup.digest('hex');

if (currentSource !== manifest.sourceDigest) {
  console.error(
    `VISION_FAIL: ${site.slug} changed since the screenshots were taken ` +
      `(captured ${shortDigest(manifest.sourceDigest)}, on disk ${shortDigest(currentSource)}).\n` +
      `  Re-run: npm run build && npm run qa:visual -- ${site.slug}`
  );
  process.exit(1);
}

const reviewPath = join(REVIEW_DIR, `${site.slug}.md`);

function stub() {
  const sheetLines = manifest.sheets
    .map((s, i) => `${i + 1}. \`${s.path}\`\n   ${s.caption}\n   - [ ] reviewed — findings:`)
    .join('\n');
  return `---
slug: ${site.slug}
digest: ${currentDigest}
sheetsReviewed: 0/${manifest.sheets.length}
verdict: PENDING
date: ${new Date().toISOString().slice(0, 10)}
---

# Visual review — ${site.slug}

Look at every sheet listed below, then set \`sheetsReviewed\` to
\`${manifest.sheets.length}/${manifest.sheets.length}\` and \`verdict\` to \`PASS\` (or \`FAIL\` while defects stand).

Record what you saw, not that you looked. "No issues found" is only acceptable
alongside the number of sheets reviewed.

## Sheets

${sheetLines}

## Findings and fixes

| # | device | what was wrong | fix applied |
|---|---|---|---|
| | | | |
`;
}

if (writeStub) {
  mkdirSync(REVIEW_DIR, { recursive: true });
  writeFileSync(reviewPath, stub(), 'utf8');
  console.log(`Wrote review stub: audit/visual-reviews/${site.slug}.md`);
  console.log(`  ${manifest.sheets.length} sheet(s) to review, digest ${shortDigest(currentDigest)}`);
  process.exit(0);
}

if (!existsSync(reviewPath)) {
  console.error(`VISION_FAIL: no visual review for ${site.slug}.`);
  console.error(`  ${manifest.sheets.length} contact sheet(s) are waiting in qa-screenshots/${site.slug}/sheets/.`);
  console.error(`  Start one with: node scripts/check-vision-review.js ${site.slug} --write-stub`);
  process.exit(1);
}

const raw = readFileSync(reviewPath, 'utf8');
const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
if (!fm) {
  console.error(`VISION_FAIL: audit/visual-reviews/${site.slug}.md has no front-matter block`);
  process.exit(1);
}
const meta = {};
for (const line of fm[1].split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z]+):\s*(.*)$/);
  if (m) meta[m[1]] = m[2].trim();
}

const failures = [];

if (meta.digest !== currentDigest) {
  failures.push(
    `review is stale — written against ${shortDigest(meta.digest) || '(none)'}, ` +
      `current evidence is ${shortDigest(currentDigest)}`
  );
}

const reviewed = String(meta.sheetsReviewed || '').match(/^(\d+)\s*\/\s*(\d+)$/);
if (!reviewed) {
  failures.push(`sheetsReviewed must read "N/${manifest.sheets.length}", found "${meta.sheetsReviewed ?? ''}"`);
} else if (Number(reviewed[2]) !== manifest.sheets.length) {
  failures.push(`sheetsReviewed totals ${reviewed[2]} sheets; the manifest has ${manifest.sheets.length}`);
} else if (Number(reviewed[1]) < manifest.sheets.length) {
  failures.push(`only ${reviewed[1]} of ${manifest.sheets.length} sheets reviewed`);
}

if (meta.verdict !== 'PASS') {
  failures.push(`verdict is "${meta.verdict ?? '(none)'}", needs PASS`);
}

if (failures.length) {
  console.error(`VISION_FAIL: ${site.slug}`);
  for (const f of failures) console.error(`  ${f}`);
  if (failures.some((f) => f.startsWith('review is stale'))) {
    console.error(`  Re-review the current sheets and update audit/visual-reviews/${site.slug}.md`);
  }
  process.exit(1);
}

console.log(
  `VISION_PASS: ${site.slug} — ${manifest.sheets.length} sheet(s) reviewed, digest ${shortDigest(currentDigest)}`
);
process.exit(0);
