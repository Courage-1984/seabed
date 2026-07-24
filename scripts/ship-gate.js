#!/usr/bin/env node
/**
 * Ship gate: copy-depth + site contract + qa-report.json cleanliness.
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

const metaPath = join(ROOT, 'sites', slug, 'meta.json');
if (!existsSync(metaPath)) {
  console.error(`SHIP_FAIL: sites/${slug}/meta.json not found`);
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

function viewHasIssues(view) {
  if (!view) return false;
  return Boolean(
    view.overflowingElements?.length ||
      view.brokenImages?.length ||
      view.nonWebpPhotos?.length ||
      view.missingAltTags?.length ||
      view.consoleErrors?.length ||
      view.networkErrors?.length ||
      view.brokenLinks?.length
  );
}

function pageFailed(r) {
  return Boolean(r.error || viewHasIssues(r.mobile) || viewHasIssues(r.desktop));
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
    const sitePages = pages.filter((p) => p.path?.startsWith(`sites/${slug}/`));
    const hub = pages.find((p) => p.path === 'index.html');

    if (!sitePages.length) {
      console.error(`SHIP_FAIL: no qa-report pages for sites/${slug}/`);
      failures.push('qa-slug-pages');
    } else {
      const dirty = sitePages.filter(pageFailed);
      if (dirty.length) {
        console.error(
          `SHIP_FAIL: ${dirty.length} qa page(s) dirty for slug: ${dirty.map((d) => d.path).join(', ')}`
        );
        failures.push('qa-slug-dirty');
      } else {
        console.log(`SHIP_QA_PASS: ${sitePages.length} page(s) clean for sites/${slug}/`);
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

if (failures.length) {
  console.error(`\nSHIP_FAIL: ${slug} — ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`\nSHIP_PASS: ${slug} (floor ${floor})`);
process.exit(0);
