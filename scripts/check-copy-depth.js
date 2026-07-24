#!/usr/bin/env node
/**
 * Fail when visible copy count is below brief §3 floor − 10%.
 * Usage: node scripts/check-copy-depth.js <slug> [floor]
 * If floor omitted, reads sites/<slug>/meta.json → wordFloor.
 * Exit 0 = pass, 1 = fail, 2 = usage error.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [slug, floorStr] = process.argv.slice(2);

if (!slug) {
  console.error('Usage: node scripts/check-copy-depth.js <slug> [floor]');
  process.exit(2);
}

let floor = Number(floorStr);
if (!Number.isFinite(floor) || floor <= 0) {
  try {
    const meta = JSON.parse(await readFile(join(ROOT, 'sites', slug, 'meta.json'), 'utf8'));
    floor = Number(meta.wordFloor);
  } catch {
    floor = NaN;
  }
}

if (!Number.isFinite(floor) || floor <= 0) {
  console.error(
    'Usage: node scripts/check-copy-depth.js <slug> [floor]\nProvide floor or set meta.wordFloor.'
  );
  process.exit(2);
}

const dir = join(ROOT, 'sites', slug);

let htmlFiles;
try {
  htmlFiles = (await readdir(dir)).filter((f) => f.endsWith('.html'));
} catch {
  console.error(`COPY_DEPTH_FAIL: sites/${slug}/ not found`);
  process.exit(1);
}

if (htmlFiles.length === 0) {
  console.error(`COPY_DEPTH_FAIL: no HTML files in sites/${slug}/`);
  process.exit(1);
}

let words = 0;
for (const file of htmlFiles) {
  const html = await readFile(join(dir, file), 'utf8');
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  const text = $('body').text() || $.root().text();
  words += text.split(/\s+/).filter(Boolean).length;
}

const min = Math.floor(floor * 0.9);
if (words < min) {
  console.error(
    `COPY_DEPTH_FAIL: ${words} words < ${min} (floor ${floor} −10%) in sites/${slug}/`
  );
  process.exit(1);
}

console.log(`COPY_DEPTH_PASS: ${words} words (min ${min}, floor ${floor})`);
process.exit(0);
