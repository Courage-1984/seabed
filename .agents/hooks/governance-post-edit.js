#!/usr/bin/env node
/**
 * Lightweight PostToolUse governance warnings (exit 0 always — warn only).
 * (a) meta.json with qa:v2-pass without clean qa-report for slug
 * (b) HTML with photographic img src ending in .png/.jpg/.jpeg
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function extractPathAndContent(payload) {
  const pathKeys = ['file_path', 'filePath', 'path', 'target_file', 'targetFile'];
  const contentKeys = ['content', 'new_string', 'newString', 'file_content', 'fileContent'];
  let filePath = '';
  let content = '';
  for (const k of pathKeys) {
    if (payload[k]) filePath = String(payload[k]);
  }
  for (const k of contentKeys) {
    if (payload[k]) content = String(payload[k]);
  }
  if (!content && payload.tool_input) {
    const ti = payload.tool_input;
    for (const k of pathKeys) if (ti[k]) filePath = String(ti[k]);
    for (const k of contentKeys) if (ti[k]) content = String(ti[k]);
  }
  return { filePath: filePath.replace(/\\/g, '/'), content };
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

function pageFailed(p) {
  return Boolean(p.error || viewHasIssues(p.mobile) || viewHasIssues(p.desktop));
}

const raw = readStdin();
let payload = {};
if (raw.trim()) {
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = { content: raw };
  }
}

const { filePath, content } = extractPathAndContent(payload);
const warnings = [];

if (filePath.includes('sites/') && filePath.endsWith('meta.json') && content.includes('"qa"')) {
  if (/"qa"\s*:\s*"v2-pass"/.test(content)) {
    const slugMatch = filePath.match(/sites\/([^/]+)\/meta\.json/);
    const slug = slugMatch?.[1];
    const reportPath = join(ROOT, 'qa-report.json');
    if (existsSync(reportPath) && slug) {
      try {
        const report = JSON.parse(readFileSync(reportPath, 'utf8'));
        const pages = Array.isArray(report) ? report : report.pages || [];
        const sitePages = pages.filter((r) => r.path?.startsWith(`sites/${slug}/`));
        const hasFailure = sitePages.some(pageFailed);
        if (hasFailure || sitePages.length === 0) {
          warnings.push(
            `[governance-hook] WARN: setting qa:v2-pass on sites/${slug}/ but qa-report.json shows failures or no pages for this slug.`
          );
        }
      } catch {
        warnings.push('[governance-hook] WARN: qa:v2-pass written but qa-report.json could not be read.');
      }
    } else {
      warnings.push(
        '[governance-hook] WARN: qa:v2-pass written but qa-report.json missing or slug not parsed — run npm run build && npm run qa first.'
      );
    }
  }
}

if (filePath.includes('sites/') && filePath.endsWith('.html') && content) {
  const bad = [...content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .filter((src) => /\.(png|jpe?g)(\?|$)/i.test(src) && !/favicon/i.test(src));
  if (bad.length) {
    warnings.push(
      `[governance-hook] WARN: HTML edit contains non-WebP photographic img src: ${bad.slice(0, 3).join(', ')}${bad.length > 3 ? '…' : ''}`
    );
  }
}

for (const w of warnings) {
  console.error(w);
}

process.exit(0);
