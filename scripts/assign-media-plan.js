#!/usr/bin/env node
/**
 * Assign a video placement slot and signature effect to every existing site.
 *
 * The 88 sites in the archive predate the Variety Engine's video/effect rolls,
 * so they have no brief seed to derive from. This backfills them deterministically
 * from a stable slug hash using a least-recently-used rule, which spaces repeats
 * further apart than replaying the seed walk would.
 *
 * Usage:
 *   node scripts/assign-media-plan.js            # dry run, prints the table
 *   node scripts/assign-media-plan.js --write    # persist into each meta.json
 *   node scripts/assign-media-plan.js --json     # machine-readable
 *
 * Existing meta.videoPlacement / meta.signatureEffect values are treated as
 * already-decided and are never overwritten -- they still participate in the
 * recency history so later assignments space themselves around them.
 *
 * Forward-going daily builds do NOT use this script: the brief rolls
 * (seed + 5) % 12 and (seed + 11) % 12 per AGENTS.md §11 / §13.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { findAllSiteDirs } from './lib/resolve-slug.js';
import { PLACEMENT_BY_FAMILY, VIDEO_PLACEMENT_SET } from './lib/video-placements.js';
import { SIGNATURE_EFFECTS, SIGNATURE_EFFECT_SET } from './lib/signature-effects.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = new Set(process.argv.slice(2));
const WRITE = args.has('--write');
const AS_JSON = args.has('--json');

/** Stable per-slug pseudo-seed, used only to break ties between equally-stale options. */
function slugSeed(slug) {
  return parseInt(createHash('sha256').update(slug).digest('hex').slice(0, 8), 16) % 10000;
}

/**
 * Least-recently-used pick: of the candidates, take the one whose last use is
 * furthest back. Ties break on the slug seed so the result is deterministic but
 * not biased toward the head of the list.
 */
function pickLRU(candidates, lastUsed, index, seed, salt) {
  let best = null;
  let bestAge = -Infinity;
  let bestTie = -1;
  candidates.forEach((value, k) => {
    const age = index - (lastUsed.has(value) ? lastUsed.get(value) : -9999);
    const tie = (seed + k * salt) % 97;
    if (age > bestAge || (age === bestAge && tie > bestTie)) {
      best = value;
      bestAge = age;
      bestTie = tie;
    }
  });
  return best;
}

const sites = [];
for (const site of findAllSiteDirs(ROOT)) {
  const metaPath = join(site.absolutePath, 'meta.json');
  let meta;
  try {
    meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  } catch {
    console.warn(`SKIP ${site.slug}: unreadable meta.json`);
    continue;
  }
  if (!meta.layoutFamily || !PLACEMENT_BY_FAMILY[meta.layoutFamily]) {
    console.warn(`SKIP ${site.slug}: unknown layoutFamily ${JSON.stringify(meta.layoutFamily)}`);
    continue;
  }
  sites.push({ site, metaPath, meta });
}

// Assign oldest -> newest so recency accumulates in chronological order.
sites.sort(
  (a, b) =>
    String(a.meta.created ?? '').localeCompare(String(b.meta.created ?? '')) || a.site.slug.localeCompare(b.site.slug)
);

const lastPlacement = new Map();
const lastEffect = new Map();
const plan = [];

sites.forEach((entry, index) => {
  const { site, meta } = entry;
  const seed = slugSeed(site.slug);
  const allowed = PLACEMENT_BY_FAMILY[meta.layoutFamily];

  // Respect anything already decided; it still counts toward recency.
  const existingPlacement = VIDEO_PLACEMENT_SET.has(meta.videoPlacement) ? meta.videoPlacement : null;
  const existingEffect = SIGNATURE_EFFECT_SET.has(meta.signatureEffect) ? meta.signatureEffect : null;

  const placement = existingPlacement ?? pickLRU(allowed, lastPlacement, index, seed, 1);
  const effect = existingEffect ?? pickLRU(SIGNATURE_EFFECTS, lastEffect, index, seed, 7);

  lastPlacement.set(placement, index);
  lastEffect.set(effect, index);

  plan.push({
    slug: site.slug,
    relativePath: site.relativePath,
    created: meta.created ?? '?',
    layoutFamily: meta.layoutFamily,
    placement,
    effect,
    pinned: Boolean(existingPlacement && existingEffect),
    metaPath: entry.metaPath,
    meta,
  });
});

// Report newest-first, the order the remediation campaign works in.
plan.reverse();

// --- quality audit -----------------------------------------------------------
function collisionsWithin(values, window) {
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < Math.min(i + window + 1, values.length); j++) {
      if (values[i] === values[j]) count++;
    }
  }
  return count;
}

const placements = plan.map((p) => p.placement);
const effects = plan.map((p) => p.effect);

if (AS_JSON) {
  console.log(
    JSON.stringify(
      plan.map(({ slug, created, layoutFamily, placement, effect }) => ({
        slug,
        created,
        layoutFamily,
        placement,
        effect,
      })),
      null,
      2
    )
  );
} else {
  console.log(
    'created    | slug                                | layout family                  | placement                | signature effect'
  );
  console.log('-'.repeat(160));
  for (const p of plan) {
    console.log(
      `${p.created} | ${p.slug.padEnd(35)} | ${p.layoutFamily.padEnd(30)} | ${p.placement.padEnd(24)} | ${p.effect}`
    );
  }

  const dist = {};
  for (const v of placements) dist[v] = (dist[v] ?? 0) + 1;

  console.log(`\n${plan.length} site(s) planned.`);
  console.log(`Placement collisions within a 5-site window: ${collisionsWithin(placements, 5)}`);
  console.log(`Placement collisions within an 8-site window: ${collisionsWithin(placements, 8)}`);
  console.log(`Effect collisions within an 11-site window:  ${collisionsWithin(effects, 11)}`);
  console.log(
    'Placement distribution: ' +
      Object.entries(dist)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')
  );
  console.log(
    '\nNotes on the residual collisions (both are floors, not bugs):\n' +
      '  - "bento" and "neo-brutalist masonry" have only 5 compatible slots each, so an\n' +
      '    8-site ban is unsatisfiable for runs containing several of them.\n' +
      '  - The effect pool holds exactly 12 entries, so LRU produces a perfect 12-cycle:\n' +
      '    every effect recurs at distance exactly 12. The bulk-backfill rule is therefore\n' +
      '    "not in the last 11", which is optimal for a 12-item pool. Daily briefs keep the\n' +
      '    last-12 ban, which works because new sites arrive one at a time.'
  );
}

if (WRITE) {
  let written = 0;
  for (const p of plan) {
    if (p.meta.videoPlacement === p.placement && p.meta.signatureEffect === p.effect) continue;
    p.meta.videoPlacement = p.placement;
    p.meta.signatureEffect = p.effect;
    writeFileSync(p.metaPath, `${JSON.stringify(p.meta, null, 2)}\n`, 'utf8');
    written++;
  }
  console.log(`\nWrote videoPlacement + signatureEffect into ${written} meta.json file(s).`);
  console.log('Note: meta.video and meta.contract are set per site during remediation, not here.');
} else {
  console.log('\nDry run. Re-run with --write to persist into meta.json.');
}
