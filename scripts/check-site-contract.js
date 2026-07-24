#!/usr/bin/env node
/**
 * Static site contract checks (no Puppeteer).
 * Usage: node scripts/check-site-contract.js [slug|--all]
 * Exit 0 = pass, 1 = fail, 2 = usage.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAYOUT_FAMILIES, LAYOUT_FAMILY_SET } from './lib/layout-families.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITES = join(ROOT, 'sites');

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/check-site-contract.js <slug|--all>');
  process.exit(2);
}

function listSlugs() {
  return readdirSync(SITES, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

const slugs = arg === '--all' ? listSlugs() : [arg];
if (arg !== '--all' && !existsSync(join(SITES, arg))) {
  console.error(`CONTRACT_FAIL: sites/${arg}/ not found`);
  process.exit(1);
}

function walkFiles(dir, pred, out = []) {
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, pred, out);
    else if (pred(ent.name, full)) out.push(full);
  }
  return out;
}

function checkSlug(slug) {
  const issues = [];
  const siteDir = join(SITES, slug);
  const metaPath = join(siteDir, 'meta.json');

  if (!existsSync(metaPath)) {
    issues.push('missing meta.json');
    return issues;
  }

  let meta;
  try {
    meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  } catch {
    issues.push('meta.json is not valid JSON');
    return issues;
  }

  for (const key of ['title', 'blurb', 'hero', 'standard']) {
    if (!meta[key] || typeof meta[key] !== 'string') {
      issues.push(`meta missing/invalid "${key}"`);
    }
  }

  if (!meta.created || !/^\d{4}-\d{2}-\d{2}$/.test(meta.created)) {
    issues.push(`meta.created must be YYYY-MM-DD (got ${JSON.stringify(meta.created)})`);
  }

  if (!meta.layoutFamily || !LAYOUT_FAMILY_SET.has(meta.layoutFamily)) {
    issues.push(
      `meta.layoutFamily must be one of: ${LAYOUT_FAMILIES.join(' | ')} (got ${JSON.stringify(meta.layoutFamily)})`
    );
  }

  if (meta.hero) {
    if (!/^assets\/.+\.webp$/i.test(meta.hero)) {
      issues.push(`meta.hero must be assets/*.webp (got ${meta.hero})`);
    } else if (!existsSync(join(siteDir, meta.hero))) {
      issues.push(`meta.hero file missing: ${meta.hero}`);
    }
  }

  const favicon = join(siteDir, 'assets', 'favicon.svg');
  if (!existsSync(favicon)) {
    issues.push('missing assets/favicon.svg');
  }

  const htmlFiles = walkFiles(siteDir, (name) => name.endsWith('.html'));
  if (!htmlFiles.length) issues.push('no HTML files');

  for (const htmlPath of htmlFiles) {
    const html = readFileSync(htmlPath, 'utf8');
    const rel = htmlPath.slice(siteDir.length + 1).replace(/\\/g, '/');

    if (!/rel=["']icon["']/i.test(html) || !/href=["']\.\/assets\/favicon\.svg["']/i.test(html)) {
      issues.push(`${rel}: missing favicon link to ./assets/favicon.svg`);
    }

    if (/["']\/assets\//.test(html)) {
      issues.push(`${rel}: absolute /assets/ path (breaks GitHub Pages)`);
    }

    const imgSrcs = [...html.matchAll(/<(?:img|source)[^>]+(?:src|srcset)=["']([^"']+)["']/gi)].map(
      (m) => m[1]
    );
    for (const src of imgSrcs) {
      const first = src.split(',')[0].trim().split(/\s+/)[0];
      if (/\.(png|jpe?g|gif)(\?|$)/i.test(first) && !/favicon/i.test(first)) {
        issues.push(`${rel}: non-WebP photo src ${first}`);
      }
    }
  }

  const cssFiles = walkFiles(siteDir, (name) => name.endsWith('.css'));
  for (const cssPath of cssFiles) {
    const css = readFileSync(cssPath, 'utf8');
    const rel = cssPath.slice(siteDir.length + 1).replace(/\\/g, '/');
    if (/["']\/assets\//.test(css)) {
      issues.push(`${rel}: absolute /assets/ path`);
    }
    const urls = [...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)].map((m) => m[1]);
    for (const u of urls) {
      if (/\.(png|jpe?g|gif)(\?|$)/i.test(u) && !/favicon/i.test(u)) {
        issues.push(`${rel}: non-WebP url() ${u}`);
      }
    }
  }

  const rasters = walkFiles(join(siteDir, 'assets'), (name) => /\.(png|jpe?g)$/i.test(name));
  for (const r of rasters) {
    issues.push(`leftover raster in assets/: ${r.slice(siteDir.length + 1).replace(/\\/g, '/')}`);
  }

  return issues;
}

let failed = 0;
for (const slug of slugs) {
  const issues = checkSlug(slug);
  if (issues.length) {
    failed++;
    console.error(`CONTRACT_FAIL: sites/${slug}/`);
    for (const issue of issues) console.error(`  - ${issue}`);
  } else {
    console.log(`CONTRACT_PASS: sites/${slug}/`);
  }
}

if (failed) {
  console.error(`\nCONTRACT_FAIL: ${failed}/${slugs.length} site(s)`);
  process.exit(1);
}
console.log(`\nCONTRACT_PASS: ${slugs.length}/${slugs.length} site(s)`);
process.exit(0);
