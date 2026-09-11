#!/usr/bin/env node
/**
 * Remediation campaign tracker.
 *
 * Reports every site newest-first with per-gate status so progress survives
 * across sessions and can never go stale -- it is derived from the repo, not
 * hand-maintained. Regenerates audit/REMEDIATION.md.
 *
 * Usage:
 *   node scripts/remediation-status.js              # table + summary
 *   node scripts/remediation-status.js --write      # also regenerate audit/REMEDIATION.md
 *   node scripts/remediation-status.js --next 8     # just the next N sites to work on
 *   node scripts/remediation-status.js --json
 *
 * Static only -- it does not run Puppeteer. `npm run qa` / `qa:visual` remain
 * the runtime gates; this answers "what still needs doing".
 */
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { findAllSiteDirs } from './lib/resolve-slug.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'audit/REMEDIATION.md');

const argv = process.argv.slice(2);
const WRITE = argv.includes('--write');
const AS_JSON = argv.includes('--json');
const nextIdx = argv.indexOf('--next');
const NEXT = nextIdx !== -1 ? Number(argv[nextIdx + 1]) || 8 : null;

/**
 * Runs a checker once over the whole repo and splits its output per site.
 *
 * Spawning the two checkers per slug meant 176 node processes for an 88-site
 * report, which took minutes. Both checkers already support `--all` and print
 * one `PREFIX_STATUS: sites/<bucket>/<slug>/` header per site, so one pass each
 * is enough.
 */
function runCheckerAll(script, prefix) {
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', script), '--all'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;

  /** slug -> { ok, out } */
  const bySlug = new Map();
  let current = null;
  for (const line of out.split('\n')) {
    const header = line.match(new RegExp(`^${prefix}_(PASS|FAIL|WARN): sites/[^/]+/([^/\\s]+)/`));
    if (header) {
      const [, verdict, slug] = header;
      if (!bySlug.has(slug)) bySlug.set(slug, { ok: true, out: '' });
      current = bySlug.get(slug);
      // A later FAIL header for the same slug must not be undone by an earlier PASS.
      if (verdict === 'FAIL') current.ok = false;
      continue;
    }
    // Indented detail lines belong to the site whose header preceded them.
    if (current && /^\s+[-~]\s/.test(line)) current.out += `${line}\n`;
    else if (/^\S/.test(line)) current = null;
  }
  return bySlug;
}

function readAll(dir, names) {
  return names
    .map((n) => join(dir, n))
    .filter(existsSync)
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
}

function walkHtml(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) walkHtml(full, out);
    else if (ent.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const contractAll = runCheckerAll('check-site-contract.js', 'CONTRACT');
const assetsAll = runCheckerAll('check-asset-isolation.js', 'ASSETS');

const rows = [];
const dedupeWorklist = [];

for (const site of findAllSiteDirs(ROOT)) {
  const dir = site.absolutePath;
  let meta = {};
  try {
    meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
  } catch {
    /* reported by the contract checker */
  }

  const html = walkHtml(dir)
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
  const js = readAll(dir, ['main.js']);
  const css = readAll(dir, ['style.css']);
  const assets = existsSync(join(dir, 'assets')) ? readdirSync(join(dir, 'assets')) : [];

  const contract = contractAll.get(site.slug) ?? { ok: false, out: '' };
  const assetsCheck = assetsAll.get(site.slug) ?? { ok: false, out: '' };

  const dupLines = assetsCheck.out
    .split('\n')
    .filter((l) => l.includes('duplicate asset'))
    .map((l) => l.replace(/^\s*[-~]\s*/, '').trim());
  if (dupLines.length) dedupeWorklist.push({ slug: site.slug, lines: dupLines });

  // A duplicate alone must not block the campaign -- it is deferred to its own pass.
  const assetsBlockingOnly = assetsCheck.ok
    ? true
    : assetsCheck.out
        .split('\n')
        .filter((l) => l.trim().startsWith('- '))
        .every((l) => l.includes('duplicate asset'));

  const videoFiles = assets.filter((a) => /\.(webm|mp4)$/i.test(a));
  const hasVideoTag = /<video/i.test(html);
  const videoTag = html.match(/<video\b[^>]*>/i)?.[0] ?? '';

  const gates = {
    contract: contract.ok,
    assets: assetsCheck.ok,
    assetsDeferrable: assetsBlockingOnly,
    videoFile: videoFiles.some((f) => /\.webm$/i.test(f)),
    mp4: videoFiles.some((f) => /\.mp4$/i.test(f)),
    poster: /\bposter=/i.test(videoTag),
    preload: /\bpreload=/i.test(videoTag),
    videoTag: hasVideoTag,
    io: /IntersectionObserver/.test(js),
    prm: /prefers-reduced-motion/.test(css + js),
    metaVideo: Boolean(meta.video),
    metaPlacement: Boolean(meta.videoPlacement),
    metaEffect: Boolean(meta.signatureEffect),
    flagged: meta.contract === 'v2.1',
  };

  const motionOk = gates.io && gates.prm;
  const videoOk = gates.videoFile && gates.mp4 && gates.poster && gates.preload && gates.videoTag && gates.metaVideo;
  const metaOk = gates.metaPlacement && gates.metaEffect;

  let status;
  if (gates.flagged && gates.contract && motionOk && videoOk && metaOk) status = 'DONE';
  else if (motionOk && metaOk && !gates.videoFile) status = 'NEEDS-VIDEO';
  else if (!assetsBlockingOnly) status = 'BLOCKED-ASSETS';
  else status = 'TODO';

  rows.push({
    slug: site.slug,
    relativePath: site.relativePath,
    created: meta.created ?? '?',
    layoutFamily: meta.layoutFamily ?? '?',
    placement: meta.videoPlacement ?? '—',
    effect: meta.signatureEffect ?? '—',
    status,
    gates,
    dupCount: dupLines.length,
  });
}

rows.sort((a, b) => String(b.created).localeCompare(String(a.created)) || a.slug.localeCompare(b.slug));

const tick = (b) => (b ? 'Y' : '-');
const summary = rows.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});

if (AS_JSON) {
  console.log(JSON.stringify({ summary, rows }, null, 2));
} else if (NEXT) {
  const todo = rows.filter((r) => r.status !== 'DONE').slice(0, NEXT);
  console.log(`Next ${todo.length} site(s) to remediate, newest-first:\n`);
  for (const r of todo) {
    console.log(`${r.created}  ${r.slug}`);
    console.log(`   layout:    ${r.layoutFamily}`);
    console.log(`   placement: ${r.placement}`);
    console.log(`   effect:    ${r.effect}`);
    console.log(
      `   needs:     ${[
        !r.gates.io && 'IntersectionObserver',
        !r.gates.prm && 'prefers-reduced-motion',
        !r.gates.videoFile && 'VIDEO (generate)',
        r.gates.videoFile && !r.gates.mp4 && 'mp4 fallback',
        r.gates.videoFile && !r.gates.poster && 'poster',
        r.gates.videoFile && !r.gates.preload && 'preload',
        !r.gates.metaVideo && 'meta.video',
        !r.gates.flagged && 'contract flag',
        r.dupCount && `${r.dupCount} dup asset(s) [deferred]`,
      ]
        .filter(Boolean)
        .join(', ')}`
    );
    console.log('');
  }
} else {
  console.log(
    'created    | slug                                | status         | ctr | ast | vid | mp4 | pos | pre | IO  | PRM | meta | dup'
  );
  console.log('-'.repeat(140));
  for (const r of rows) {
    console.log(
      `${r.created} | ${r.slug.padEnd(35)} | ${r.status.padEnd(14)} |  ${tick(r.gates.contract)}  |  ${tick(
        r.gates.assets
      )}  |  ${tick(r.gates.videoFile)}  |  ${tick(r.gates.mp4)}  |  ${tick(r.gates.poster)}  |  ${tick(
        r.gates.preload
      )}  |  ${tick(r.gates.io)}  |  ${tick(r.gates.prm)}  |  ${tick(
        r.gates.metaVideo && r.gates.metaPlacement && r.gates.metaEffect
      )}   | ${r.dupCount || '-'}`
    );
  }
  console.log(
    `\n${rows.length} sites — ` +
      Object.entries(summary)
        .sort()
        .map(([k, v]) => `${k}: ${v}`)
        .join('  |  ')
  );
  const totalDupes = dedupeWorklist.reduce((n, d) => n + d.lines.length, 0);
  console.log(`Deferred dedupe worklist: ${totalDupes} duplicate finding(s) across ${dedupeWorklist.length} site(s).`);
}

if (WRITE) {
  const md = [
    '<!-- GENERATED — do not hand-edit. Regenerate: npm run status -- --write -->',
    '',
    '# Remediation campaign status',
    '',
    `Generated ${new Date().toISOString()} from ${rows.length} sites.`,
    '',
    'Bringing every site up to the strict contract (video + motion budget + asset isolation),',
    'walking newest → oldest. A site is `DONE` once it carries `"contract": "v2.1"` in `meta.json`',
    'and passes every gate. See `AGENTS.md` §11–§15 for what each gate means.',
    '',
    '## Summary',
    '',
    ...Object.entries(summary)
      .sort()
      .map(([k, v]) => `- **${k}**: ${v}`),
    '',
    '## Sites (newest first)',
    '',
    '| created | slug | status | placement | signature effect | outstanding |',
    '|---------|------|--------|-----------|------------------|-------------|',
    ...rows.map((r) => {
      const needs = [
        !r.gates.io && 'IntersectionObserver',
        !r.gates.prm && 'prefers-reduced-motion',
        !r.gates.videoFile && '**video**',
        r.gates.videoFile && !r.gates.mp4 && 'mp4',
        r.gates.videoFile && !r.gates.poster && 'poster',
        r.gates.videoFile && !r.gates.preload && 'preload',
        !r.gates.metaVideo && 'meta.video',
        !r.gates.flagged && 'contract flag',
      ].filter(Boolean);
      return `| ${r.created} | ${r.slug} | ${r.status} | ${r.placement} | ${r.effect} | ${needs.join(', ') || '—'} |`;
    }),
    '',
    '## Deferred dedupe worklist',
    '',
    'Cross-site byte-identical assets. These do **not** block `DONE` in this campaign —',
    'fixing them means regenerating imagery, which is handled in a separate pass so the',
    "operator's image-generation quota is not spent mid-remediation.",
    '',
  ];

  if (dedupeWorklist.length) {
    for (const d of dedupeWorklist) {
      md.push(`### ${d.slug}`, '');
      for (const line of d.lines) md.push(`- ${line}`);
      md.push('');
    }
  } else {
    md.push('_None._', '');
  }

  writeFileSync(OUT, `${md.join('\n')}\n`, 'utf8');
  console.log(`\nWrote ${OUT.replace(/\\/g, '/')}`);
}
