#!/usr/bin/env node
/**
 * Rotation gate: does this site repeat the sites built just before it?
 *
 * Checks the rolled values in meta.json (layout, video slot, effect, style family)
 * AND what actually shipped (Google Fonts, :root palette fingerprint) against the
 * sites created before it. Runs inside check:ship; run it yourself right after
 * scaffolding, once meta.json and the :root block exist, so a repeat is caught
 * before the build rather than after it.
 *
 * Usage: node scripts/check-variety.js <slug> [--as-date YYYY-MM-DD]
 *   --as-date  judge the site as if created on that date (testing; ignores the cutoff check)
 * Exit 0 = pass or skipped (created before the rotation cutoff), 1 = fail, 2 = usage.
 *
 * Not run in CI: a same-day sibling added later would retroactively fail an
 * earlier site. Per-slug only, like check:vision.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSlugPath } from './lib/resolve-slug.js';
import { siteFingerprint } from './lib/site-fingerprint.js';
import { ROTATION_CUTOFF, loadHistory, varietyFindings } from './lib/rotation.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let slug = null;
let asDate = null;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--as-date') asDate = argv[++i];
  else if (!argv[i].startsWith('--') && !slug) slug = argv[i];
  else {
    console.error(`Unknown arg: ${argv[i]}`);
    process.exit(2);
  }
}
if (!slug || (asDate && !/^\d{4}-\d{2}-\d{2}$/.test(asDate))) {
  console.error('Usage: node scripts/check-variety.js <slug> [--as-date YYYY-MM-DD]');
  process.exit(2);
}

const site = resolveSlugPath(ROOT, slug);
if (!site) {
  console.error(`VARIETY_FAIL: site "${slug}" not found across ./sites/`);
  process.exit(1);
}

let meta;
try {
  meta = JSON.parse(readFileSync(join(site.absolutePath, 'meta.json'), 'utf8'));
} catch {
  console.error(`VARIETY_FAIL: ${site.relativePath}/meta.json missing or invalid`);
  process.exit(1);
}

const created = asDate ?? meta.created;
if (!asDate && !(typeof created === 'string' && created >= ROTATION_CUTOFF)) {
  console.log(`VARIETY_SKIP: ${site.relativePath}/ (created ${created ?? '?'} predates the ${ROTATION_CUTOFF} cutoff)`);
  process.exit(0);
}

/** Visible text of every link and button, for the CTA-vocabulary warning. */
function ctaTexts(dir) {
  const out = [];
  const files = readdirSync(dir).filter((f) => f.endsWith('.html'));
  for (const f of files) {
    const html = readFileSync(join(dir, f), 'utf8');
    for (const m of html.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
      const text = m[2]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) out.push(text);
    }
  }
  return out;
}

const fp = siteFingerprint(site.absolutePath);
const history = loadHistory(ROOT, { beforeDate: created, excludeSlug: site.slug });
const { fails, warns } = varietyFindings(
  {
    layoutFamily: meta.layoutFamily,
    videoPlacement: meta.videoPlacement,
    signatureEffect: meta.signatureEffect,
    styleFamily: meta.styleFamily,
    fonts: fp.fonts,
    palette: fp.palette,
    ctaTexts: existsSync(site.absolutePath) ? ctaTexts(site.absolutePath) : [],
  },
  history
);

console.log(
  `  shipped: fonts ${fp.fonts.length ? fp.fonts.join(' + ') : '(none yet)'} | palette ${fp.palette?.signature ?? '(unreadable)'}`
);
for (const w of warns) console.log(`  ! ${w}`);

if (fails.length) {
  console.error(
    `VARIETY_FAIL: ${site.relativePath}/ (judged as of ${created}, against ${history.length} earlier sites)`
  );
  for (const f of fails) console.error(`  - ${f}`);
  console.error(`  re-resolve the failing values: npm run roll -- --for ${site.slug}`);
  process.exit(1);
}
console.log(`VARIETY_PASS: ${site.relativePath}/ (judged as of ${created}, against ${history.length} earlier sites)`);
process.exit(0);
