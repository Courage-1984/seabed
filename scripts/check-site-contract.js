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
import { VIDEO_PLACEMENTS, VIDEO_PLACEMENT_SET, PLACEMENT_BY_FAMILY } from './lib/video-placements.js';
import { SIGNATURE_EFFECTS, SIGNATURE_EFFECT_SET } from './lib/signature-effects.js';
import { findAllSiteDirs, resolveSlugPath } from './lib/resolve-slug.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Sites created on or after this date must carry the video + motion contract
 * (meta.video / meta.videoPlacement / meta.signatureEffect, IntersectionObserver
 * reveal system, prefers-reduced-motion block). Older sites predate the rule and
 * are checked against the original contract only -- until they are remediated,
 * at which point they declare `"contract": "v2.1"` in meta.json and are held to
 * the full contract regardless of age (see audit/REMEDIATION.md).
 */
const CONTRACT_V2_1_CUTOFF = '2026-09-07';
const CONTRACT_V2_1 = 'v2.1';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/check-site-contract.js <slug|--all>');
  process.exit(2);
}

const siteDescriptors = arg === '--all' ? findAllSiteDirs(ROOT) : [resolveSlugPath(ROOT, arg)].filter(Boolean);

if (arg !== '--all' && siteDescriptors.length === 0) {
  console.error(`CONTRACT_FAIL: site not found for target "${arg}"`);
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

function checkSite(site) {
  const issues = [];
  const warnings = [];
  /** Video/motion findings are hard failures for versioned sites, advisory for legacy ones. */
  const noteVersioned = (msg) => (versioned ? issues : warnings).push(msg);
  let versioned = false;
  const siteDir = site.absolutePath;
  const metaPath = join(siteDir, 'meta.json');

  if (!existsSync(metaPath)) {
    issues.push('missing meta.json');
    return { issues, warnings };
  }

  let meta;
  try {
    meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  } catch {
    issues.push('meta.json is not valid JSON');
    return { issues, warnings };
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

  // --- video + motion contract (remediated sites, or those created on/after the cutoff) ---
  versioned =
    meta.contract === CONTRACT_V2_1 || (typeof meta.created === 'string' && meta.created >= CONTRACT_V2_1_CUTOFF);

  if (meta.contract !== undefined && meta.contract !== CONTRACT_V2_1) {
    issues.push(`meta.contract must be "${CONTRACT_V2_1}" when present (got ${JSON.stringify(meta.contract)})`);
  }

  if (versioned) {
    if (!meta.video || typeof meta.video !== 'string') {
      issues.push('meta missing "video" (assets/<slug>-<slot>.webm) — every site ships exactly one video');
    } else if (!/^assets\/.+\.webm$/i.test(meta.video)) {
      issues.push(`meta.video must be assets/*.webm (got ${meta.video})`);
    } else if (!existsSync(join(siteDir, meta.video))) {
      issues.push(`meta.video file missing: ${meta.video}`);
    }

    if (!meta.videoPlacement || !VIDEO_PLACEMENT_SET.has(meta.videoPlacement)) {
      issues.push(
        `meta.videoPlacement must be one of: ${VIDEO_PLACEMENTS.join(' | ')} (got ${JSON.stringify(meta.videoPlacement)})`
      );
    } else if (LAYOUT_FAMILY_SET.has(meta.layoutFamily)) {
      const allowed = PLACEMENT_BY_FAMILY[meta.layoutFamily] ?? [];
      if (!allowed.includes(meta.videoPlacement)) {
        issues.push(
          `meta.videoPlacement "${meta.videoPlacement}" is not compatible with layoutFamily "${meta.layoutFamily}" (allowed: ${allowed.join(' | ')})`
        );
      }
    }

    if (!meta.signatureEffect || !SIGNATURE_EFFECT_SET.has(meta.signatureEffect)) {
      issues.push(
        `meta.signatureEffect must be one of: ${SIGNATURE_EFFECTS.join(' | ')} (got ${JSON.stringify(meta.signatureEffect)})`
      );
    }
  }

  const htmlFiles = walkFiles(siteDir, (name) => name.endsWith('.html'));
  if (!htmlFiles.length) issues.push('no HTML files');

  /* Total tags is informational; the rule below counts distinct clips. */
  let videoCount = 0;
  /**
   * Distinct video files referenced site-wide. The "exactly one video" rule is
   * about shipping one clip, not one <video> tag: a shared footer or nav loop
   * legitimately repeats the same element on every page of a multi-page site.
   */
  const videoSources = new Set();

  for (const htmlPath of htmlFiles) {
    const html = readFileSync(htmlPath, 'utf8');
    const rel = htmlPath.slice(siteDir.length + 1).replace(/\\/g, '/');

    if (!/rel=["']icon["']/i.test(html) || !/href=["']\.\/assets\/favicon\.svg["']/i.test(html)) {
      issues.push(`${rel}: missing favicon link to ./assets/favicon.svg`);
    }

    if (/["']\/assets\//.test(html)) {
      issues.push(`${rel}: absolute /assets/ path (breaks GitHub Pages)`);
    }

    const imgSrcs = [...html.matchAll(/<(?:img|source)[^>]+(?:src|srcset)=["']([^"']+)["']/gi)].map((m) => m[1]);
    for (const src of imgSrcs) {
      const first = src.split(',')[0].trim().split(/\s+/)[0];
      if (/\.(png|jpe?g|gif)(\?|$)/i.test(first) && !/favicon/i.test(first)) {
        issues.push(`${rel}: non-WebP photo src ${first}`);
      }
    }

    // <video> markup contract
    const videoTags = [...html.matchAll(/<video\b[^>]*>/gi)].map((m) => m[0]);
    videoCount += videoTags.length;
    for (const m of html.matchAll(/<video\b[^>]*?\bsrc=["']([^"']+)["']/gi)) {
      videoSources.add(m[1].replace(/\.(webm|mp4)$/i, ''));
    }
    for (const m of html.matchAll(/<source\b[^>]*?\bsrc=["']([^"']+\.(?:webm|mp4))["']/gi)) {
      // The webm and mp4 of one clip are a single video, not two.
      videoSources.add(m[1].replace(/\.(webm|mp4)$/i, ''));
    }
    for (const tag of videoTags) {
      for (const attr of ['muted', 'loop', 'playsinline']) {
        if (!new RegExp(`\\b${attr}\\b`, 'i').test(tag)) {
          noteVersioned(`${rel}: <video> missing required ${attr} attribute`);
        }
      }
      if (!/\bposter=/i.test(tag)) noteVersioned(`${rel}: <video> missing poster attribute`);
      if (!/\bpreload=/i.test(tag)) noteVersioned(`${rel}: <video> missing preload attribute (use preload="metadata")`);
      if (/\bcontrols\b/i.test(tag) && /\bautoplay\b/i.test(tag) && /\bloop\b/i.test(tag)) {
        // ambient loops should not expose controls; a demo player should not autoplay-loop
        noteVersioned(`${rel}: <video> combines controls with autoplay+loop — pick an ambient loop or a demo player`);
      }
    }
  }

  if (versioned && videoCount === 0) {
    issues.push('no <video> element found — meta.video must be implemented in the markup');
  }
  if (videoSources.size > 1) {
    noteVersioned(
      `${videoSources.size} distinct video files referenced (${[...videoSources].join(', ')}) — every site ships exactly one video`
    );
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

  // --- motion budget (see AGENTS.md "Motion budget") ---
  if (versioned) {
    const jsSource = walkFiles(siteDir, (name) => name.endsWith('.js'))
      .map((p) => readFileSync(p, 'utf8'))
      .join('\n');
    const cssSource = cssFiles.map((p) => readFileSync(p, 'utf8')).join('\n');

    if (!/IntersectionObserver/.test(jsSource)) {
      issues.push('no IntersectionObserver found — a staggered scroll-reveal system is mandatory');
    }
    if (!/prefers-reduced-motion/.test(cssSource + jsSource)) {
      issues.push('no prefers-reduced-motion handling — motion must be neutralisable');
    }
    if (!/@keyframes|transition\s*:|animation\s*:/.test(cssSource)) {
      issues.push('no CSS transitions/animations found — every site needs an implemented motion system');
    }
  }

  return { issues, warnings };
}

let failed = 0;
let warned = 0;
for (const site of siteDescriptors) {
  const { issues, warnings } = checkSite(site);
  if (issues.length) {
    failed++;
    console.error(`CONTRACT_FAIL: ${site.relativePath}/`);
    for (const issue of issues) console.error(`  - ${issue}`);
  } else {
    console.log(`CONTRACT_PASS: ${site.relativePath}/`);
  }
  if (warnings.length) {
    warned++;
    console.warn(`CONTRACT_WARN: ${site.relativePath}/ (legacy — not yet remediated to contract ${CONTRACT_V2_1})`);
    for (const w of warnings) console.warn(`  ~ ${w}`);
  }
}

if (warned) {
  console.warn(`\nCONTRACT_WARN: ${warned} legacy site(s) with advisory findings (not blocking)`);
}

if (failed) {
  console.error(`\nCONTRACT_FAIL: ${failed}/${siteDescriptors.length} site(s)`);
  process.exit(1);
}
console.log(`\nCONTRACT_PASS: ${siteDescriptors.length}/${siteDescriptors.length} site(s)`);
process.exit(0);
