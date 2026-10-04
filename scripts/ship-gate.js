#!/usr/bin/env node
/**
 * Ship gate: copy-depth + site contract + rotation variety + asset isolation + qa-report.json cleanliness.
 * Does not run Puppeteer — consume an existing qa-report.json from npm run qa.
 *
 * Usage: node scripts/ship-gate.js <slug> [--floor N]
 * Floor: --floor N or meta.wordFloor
 * Exit 0 = pass, 1 = fail, 2 = usage.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { resolveSlugPath } from './lib/resolve-slug.js';
import { pageFailed, viewIssueSummary, viewsOf, visualBlockers } from './lib/qa-verdict.js';
import { siteSourceDigest, shortDigest } from './lib/source-digest.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  let slug = null;
  let floor = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--floor') {
      floor = Number(argv[++i]);
    } else if (!argv[i].startsWith('--') && !slug) {
      slug = argv[i];
    } else {
      console.error(`Unknown arg: ${argv[i]}`);
      process.exit(2);
    }
  }
  return { slug, floor };
}

const { slug, floor: floorArg } = parseArgs(process.argv.slice(2));
if (!slug) {
  console.error('Usage: node scripts/ship-gate.js <slug> [--floor N]');
  process.exit(2);
}

const site = resolveSlugPath(ROOT, slug);
if (!site) {
  console.error(`SHIP_FAIL: site "${slug}" not found across ./sites/`);
  process.exit(1);
}

const metaPath = join(site.absolutePath, 'meta.json');
if (!existsSync(metaPath)) {
  console.error(`SHIP_FAIL: ${site.relativePath}/meta.json not found`);
  process.exit(1);
}

const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
const floor = Number.isFinite(floorArg) && floorArg > 0 ? floorArg : Number(meta.wordFloor);
if (!Number.isFinite(floor) || floor <= 0) {
  console.error('SHIP_FAIL: need --floor N or meta.wordFloor (positive number)');
  process.exit(2);
}

function runNode(script, args) {
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status ?? 1;
}

const failures = [];

if (runNode('check-copy-depth.js', [slug, String(floor)]) !== 0) {
  failures.push('copy-depth');
}
if (runNode('check-site-contract.js', [slug]) !== 0) {
  failures.push('contract');
}
// Rotation: layout / slot / effect / style family / fonts / palette vs the sites before it.
// Skips itself (exit 0) for sites created before the rotation cutoff.
if (runNode('check-variety.js', [slug]) !== 0) {
  failures.push('variety');
}
// Cross-site duplicates are deferred to the dedupe pass (see audit/REMEDIATION.md);
// hotlinks and out-of-folder references still fail the gate.
if (runNode('check-asset-isolation.js', [slug, '--defer-duplicates']) !== 0) {
  failures.push('asset-isolation');
}

const reportPath = join(ROOT, 'qa-report.json');
if (!existsSync(reportPath)) {
  console.error('SHIP_FAIL: qa-report.json missing — run npm run build && npm run qa first');
  failures.push('qa-report-missing');
} else {
  let report;
  try {
    report = JSON.parse(readFileSync(reportPath, 'utf8'));
  } catch {
    console.error('SHIP_FAIL: qa-report.json is not valid JSON');
    failures.push('qa-report-invalid');
    report = null;
  }

  if (report) {
    const pages = Array.isArray(report) ? report : report.pages || [];
    const sitePages = pages.filter((p) => p.path?.startsWith(`${site.relativePath}/`));
    const hub = pages.find((p) => p.path === 'index.html');

    // A green report is worthless if it describes bytes that have since
    // changed. imperivm-spqr shipped on a report generated before its last two
    // edits; this is the check that would have caught it.
    const recorded = report.sourceDigests?.[site.relativePath];
    if (!recorded) {
      console.error(
        'SHIP_FAIL: qa-report.json predates source-digest binding - re-run npm run build && npm run qa'
      );
      failures.push('qa-report-unbound');
    } else {
      const current = siteSourceDigest(site.absolutePath);
      if (current !== recorded) {
        console.error(
          `SHIP_FAIL: qa-report.json is stale for ${site.relativePath} ` +
            `(tested ${shortDigest(recorded)}, on disk ${shortDigest(current)}) - rebuild and re-run npm run qa`
        );
        failures.push('qa-report-stale');
      }
    }

    if (!sitePages.length) {
      console.error(`SHIP_FAIL: no qa-report pages for ${site.relativePath}/`);
      failures.push('qa-slug-pages');
    } else {
      const dirty = sitePages.filter(pageFailed);
      if (dirty.length) {
        console.error(`SHIP_FAIL: ${dirty.length} qa page(s) dirty for slug:`);
        for (const d of dirty) {
          for (const { key, view } of viewsOf(d)) {
            const hits = viewIssueSummary(view);
            if (hits.length) console.error(`  ${d.path} @${key} - ${hits.join(', ')}`);
          }
          if (d.error) console.error(`  ${d.path} - load error: ${d.error}`);
        }
        failures.push('qa-slug-dirty');
      } else {
        const deviceCount = viewsOf(sitePages[0]).length;
        console.log(
          `SHIP_QA_PASS: ${sitePages.length} page(s) clean for ${site.relativePath}/ across ${deviceCount} device(s)`
        );
      }
    }

    if (hub) {
      if (pageFailed(hub)) {
        console.error('SHIP_FAIL: hub index.html has QA issues');
        failures.push('qa-hub-dirty');
      } else {
        console.log('SHIP_QA_PASS: hub index.html clean');
      }
    } else {
      console.error('SHIP_FAIL: hub index.html missing from qa-report (re-run qa without --no-hub)');
      failures.push('qa-hub-missing');
    }

    if (report.summary && report.summary.pass === false && !failures.includes('qa-slug-dirty')) {
      // Full-repo fail is OK if our slug+hub are clean; only warn
      console.log('Note: report.summary.pass is false (other sites may be dirty); slug/hub checked above.');
    }
  }
}

// The visual findings themselves. check:vision below proves a review happened;
// this proves the machine checks were clean. Without it a site could report
// hundreds of layout and contrast defects and still ship, because the only
// thing anyone read was the agent's own verdict line.
const visualReportPath = join(ROOT, 'qa-visual-report.json');
if (!existsSync(visualReportPath)) {
  console.error(`SHIP_FAIL: qa-visual-report.json missing - run npm run qa:visual -- ${slug}`);
  failures.push('qa-visual-missing');
} else {
  let visual = null;
  try {
    visual = JSON.parse(readFileSync(visualReportPath, 'utf8'));
  } catch {
    console.error('SHIP_FAIL: qa-visual-report.json is not valid JSON');
    failures.push('qa-visual-invalid');
  }
  if (visual) {
    // The file holds one slug at a time, so a run for a different site must
    // not be mistaken for a clean result here.
    if (visual.slug !== site.slug) {
      console.error(
        `SHIP_FAIL: qa-visual-report.json is for "${visual.slug}", not "${site.slug}" - re-run npm run qa:visual -- ${slug}`
      );
      failures.push('qa-visual-other-slug');
    } else if (visual.sourceDigest !== siteSourceDigest(site.absolutePath)) {
      console.error(
        `SHIP_FAIL: qa-visual-report.json is stale for ${site.relativePath} - rebuild and re-run npm run qa:visual`
      );
      failures.push('qa-visual-stale');
    } else {
      const blockers = visualBlockers(visual);
      if (blockers.length) {
        const total = blockers.reduce((n, b) => n + b.count, 0);
        console.error(`SHIP_FAIL: ${total} blocking visual finding(s) for ${site.relativePath}:`);
        for (const b of blockers) console.error(`  ${b.path} @${b.device} ${b.key} (${b.count}) e.g. ${b.samples[0]}`);
        failures.push('qa-visual-dirty');
      } else {
        console.log(`SHIP_VISUAL_PASS: no blocking findings for ${site.relativePath}/`);
      }
    }
  }
}

// The Extreme Visual Audit (AGENTS.md 14) used to be enforced by nothing at
// all: a site with zero screenshots and no review still reached SHIP_PASS.
if (runNode('check-vision-review.js', [slug]) !== 0) {
  failures.push('vision-review');
}

if (failures.length) {
  console.error(`\nSHIP_FAIL: ${slug} — ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`\nSHIP_PASS: ${slug} (floor ${floor})`);
process.exit(0);
