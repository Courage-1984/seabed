#!/usr/bin/env node
/**
 * Per-site asset isolation checks.
 *
 * Assets are site-private. A site must never reuse, copy, or reference an image
 * or video belonging to another site, and must never hotlink remote media.
 *
 * Usage: node scripts/check-asset-isolation.js <slug|--all>
 * Exit 0 = pass, 1 = fail, 2 = usage.
 *
 * Scoping:
 *   <slug>  hard-fails on anything involving that slug (including a duplicate it
 *           shares with any other site).
 *   --all   hard-fails on out-of-folder references and hotlinks anywhere;
 *           reports legacy-vs-legacy duplicates as warnings so the existing
 *           archive does not block today's build.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, relative, resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findAllSiteDirs, resolveSlugPath } from './lib/resolve-slug.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ALLOWLIST_PATH = join(ROOT, '.agents/asset-allowlist.json');

const argv = process.argv.slice(2);
/**
 * Cross-site duplicates are a content problem -- the fix is regenerating
 * imagery -- not a correctness bug like a hotlink or an out-of-folder
 * reference. During the remediation campaign they are tracked in
 * audit/REMEDIATION.md and fixed in a dedicated pass, so this flag downgrades
 * them to warnings. They are still printed loudly, never silently dropped.
 */
const DEFER_DUPLICATES = argv.includes('--defer-duplicates');
const arg = argv.find((a) => a !== '--defer-duplicates');
if (!arg) {
  console.error('Usage: node scripts/check-asset-isolation.js <slug|--all> [--defer-duplicates]');
  process.exit(2);
}

const allSites = findAllSiteDirs(ROOT);
const target = arg === '--all' ? null : resolveSlugPath(ROOT, arg);
if (arg !== '--all' && !target) {
  console.error(`ASSETS_FAIL: site not found for target "${arg}"`);
  process.exit(1);
}

/** Hashes deliberately shared across sites, if any. Empty by default. */
let allowlist = new Set();
if (existsSync(ALLOWLIST_PATH)) {
  try {
    const raw = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
    allowlist = new Set(raw.sharedHashes ?? []);
  } catch {
    console.warn(`ASSETS_WARN: could not parse ${relative(ROOT, ALLOWLIST_PATH)} — ignoring allowlist`);
  }
}

const GENERIC_NAME =
  /^(?:image|img|photo|picture|pic|hero|banner|background|bg|video|temp|tmp|untitled|download|asset|file|new|final|copy)[-_ ]?\d*$/i;

const MEDIA_EXT = /\.(webp|webm|mp4|svg|png|jpe?g|gif|avif|mov|m4v|ogg|ogv)$/i;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// --- 1. hash every asset, repo-wide -----------------------------------------
/** sha256 -> [{ slug, rel }] */
const byHash = new Map();
/** slug -> Set of asset paths relative to the site folder */
const assetsBySlug = new Map();

for (const site of allSites) {
  const assetDir = join(site.absolutePath, 'assets');
  const files = walk(assetDir);
  const rels = new Set();
  for (const file of files) {
    const rel = relative(site.absolutePath, file).replace(/\\/g, '/');
    rels.add(rel);
    const hash = createHash('sha256').update(readFileSync(file)).digest('hex');
    if (!byHash.has(hash)) byHash.set(hash, []);
    byHash.get(hash).push({ slug: site.slug, rel, relativePath: site.relativePath });
  }
  assetsBySlug.set(site.slug, rels);
}

// --- 2. per-site reference + hygiene checks ----------------------------------
function checkSite(site) {
  const issues = [];
  const warnings = [];
  const siteDir = site.absolutePath;
  const rels = assetsBySlug.get(site.slug) ?? new Set();
  const referenced = new Set();

  const sourceFiles = walk(siteDir).filter((f) => /\.(html|css|js|json)$/i.test(f));

  for (const file of sourceFiles) {
    const rel = relative(siteDir, file).replace(/\\/g, '/');
    const src = readFileSync(file, 'utf8');

    // Every quoted string and every url() target that looks like a media path.
    const candidates = new Set();
    for (const m of src.matchAll(/(?:src|srcset|href|poster|data-src|data-poster)\s*=\s*["']([^"']+)["']/gi)) {
      for (const part of m[1].split(',')) candidates.add(part.trim().split(/\s+/)[0]);
    }
    for (const m of src.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) candidates.add(m[1].trim());
    for (const m of src.matchAll(/["'`]([^"'`\s]*\.(?:webp|webm|mp4|svg|png|jpe?g|gif|avif))["'`]/gi)) {
      candidates.add(m[1]);
    }

    for (const raw of candidates) {
      if (!raw || raw.startsWith('data:') || raw.startsWith('#')) continue;

      if (/^https?:\/\//i.test(raw)) {
        if (MEDIA_EXT.test(raw)) {
          issues.push(`${rel}: hotlinked remote media ${raw} — assets must be local and site-private`);
        }
        continue;
      }

      if (raw.startsWith('/')) {
        issues.push(
          `${rel}: absolute path ${raw} — use ./assets/... (breaks GitHub Pages and escapes the site folder)`
        );
        continue;
      }

      // Resolve relative to the file that referenced it.
      const resolved = resolve(dirname(file), raw.split('?')[0].split('#')[0]);
      const inside = relative(siteDir, resolved);
      if (inside.startsWith('..')) {
        issues.push(
          `${rel}: reference escapes the site folder — ${raw} resolves outside sites/${site.relativePath.split('/').pop()}/`
        );
        continue;
      }
      const insidePosix = inside.replace(/\\/g, '/');
      if (insidePosix.startsWith('assets/')) referenced.add(insidePosix);
    }
  }

  // Filename hygiene + orphans
  for (const assetRel of rels) {
    const base = posix.basename(assetRel).replace(/\.[^.]+$/, '');
    if (assetRel !== 'assets/favicon.svg' && GENERIC_NAME.test(base)) {
      warnings.push(`generic asset filename "${assetRel}" — name it for its actual subject`);
    }
    if (assetRel !== 'assets/favicon.svg' && !referenced.has(assetRel)) {
      warnings.push(`orphan asset "${assetRel}" — present but referenced nowhere`);
    }
  }

  return { issues, warnings };
}

// --- 3. cross-site duplicates ------------------------------------------------
const duplicateGroups = [];
for (const [hash, entries] of byHash) {
  if (allowlist.has(hash)) continue;
  const slugs = new Set(entries.map((e) => e.slug));
  if (slugs.size > 1) duplicateGroups.push({ hash, entries });
}

// --- 4. report ---------------------------------------------------------------
const scope = target ? [target] : allSites;
let failed = 0;
let warned = 0;
let deferredDuplicates = 0;

for (const site of scope) {
  const { issues, warnings } = checkSite(site);

  // Duplicates that involve this site.
  for (const group of duplicateGroups) {
    const mine = group.entries.filter((e) => e.slug === site.slug);
    if (!mine.length) continue;
    const others = group.entries.filter((e) => e.slug !== site.slug);
    const msg = `duplicate asset ${mine.map((e) => e.rel).join(', ')} is byte-identical to ${others
      .map((e) => `${e.slug}/${e.rel}`)
      .join(', ')} — every site needs its own imagery and video`;
    // Hard fail when the site is the explicit target, unless duplicates are
    // deferred; always advisory during a repo sweep.
    if (target && DEFER_DUPLICATES) deferredDuplicates++;
    (target && !DEFER_DUPLICATES ? issues : warnings).push(msg);
  }

  if (issues.length) {
    failed++;
    console.error(`ASSETS_FAIL: ${site.relativePath}/`);
    for (const i of issues) console.error(`  - ${i}`);
  } else {
    console.log(`ASSETS_PASS: ${site.relativePath}/`);
  }
  if (warnings.length) {
    warned++;
    console.warn(`ASSETS_WARN: ${site.relativePath}/`);
    for (const w of warnings) console.warn(`  ~ ${w}`);
  }
}

if (!target && duplicateGroups.length) {
  console.warn(`\nASSETS_WARN: ${duplicateGroups.length} asset(s) shared across sites (advisory in --all mode):`);
  for (const group of duplicateGroups) {
    console.warn(`  ~ ${group.entries.map((e) => `${e.slug}/${e.rel}`).join('  ==  ')}`);
  }
}

if (DEFER_DUPLICATES && deferredDuplicates) {
  console.warn(
    `
ASSETS_DEFERRED: ${deferredDuplicates} cross-site duplicate(s) not blocking this gate — ` +
      'tracked in audit/REMEDIATION.md for the dedupe pass.'
  );
}

if (failed) {
  console.error(`\nASSETS_FAIL: ${failed}/${scope.length} site(s)`);
  process.exit(1);
}
console.log(`\nASSETS_PASS: ${scope.length}/${scope.length} site(s)${warned ? ` (${warned} with warnings)` : ''}`);
process.exit(0);
