#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { findAllSiteDirs } from './lib/resolve-slug.js';
import { readRootVars } from './lib/site-fingerprint.js';
import { resolveStyleFamily } from './lib/style-families.js';

const ROOT = resolve('.');
const OUT_DIR = join(ROOT, 'public');
const OUT_FILE = join(OUT_DIR, 'sites.json');

const allSites = findAllSiteDirs(ROOT);
const sitesData = [];

for (const site of allSites) {
  try {
    const raw = readFileSync(join(site.absolutePath, 'meta.json'), 'utf8');
    const meta = JSON.parse(raw);
    meta.siteFolder = site.relativePath.replace(/\\/g, '/');
    if (!meta.siteFolder.startsWith('./')) {
      meta.siteFolder = './' + meta.siteFolder;
    }
    // The hub orders cards as a rotation of style families. Older sites have no
    // meta.styleFamily, so it is resolved here (legacy map, else palette classifier)
    // rather than written into their meta.json, which the visual-review digest hashes.
    meta.styleFamily = resolveStyleFamily(site.slug, meta, readRootVars(site.absolutePath)).family;
    sitesData.push(meta);
  } catch (err) {
    console.warn(`Could not read meta.json for ${site.slug}: ${err.message}`);
  }
}

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true });
}

writeFileSync(OUT_FILE, JSON.stringify(sitesData, null, 2), 'utf8');
console.log(`Wrote ${sitesData.length} sites to public/sites.json`);
