#!/usr/bin/env node
/**
 * Regenerates .agents/prompts/_sites-index.md from sites meta.json files.
 * Operator pastes sections into the external Gemini brief prompt (~weekly).
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITES = join(ROOT, 'sites');
const OUT = join(ROOT, '.agents/prompts/_sites-index.md');

const dirs = (await readdir(SITES, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const rows = [];
for (const slug of dirs) {
  try {
    const raw = await readFile(join(SITES, slug, 'meta.json'), 'utf8');
    const meta = JSON.parse(raw);
    const layout = meta.layoutFamily ?? meta.layout ?? '—';
    const created = meta.created ?? '—';
    rows.push(`| ${slug} | ${meta.title ?? '—'} | ${layout} | ${created} |`);
  } catch {
    rows.push(`| ${slug} | — | — | — |`);
  }
}

const rosterLines = [];
let line = '';
for (const slug of dirs) {
  const piece = line ? `, ${slug}` : slug;
  if (line && (line + piece).length > 88) {
    rosterLines.push(line + ',');
    line = slug;
  } else {
    line += piece;
  }
}
if (line) rosterLines.push(line);

const md = `<!-- GENERATED — paste sections below into your external Gemini brief prompt (~weekly).
     Regenerate: npm run sites:index
     Cadence: manual-weekly (see audit/STATUS.md) -->

## Existing sites (collision reference)

| slug | title | layout-family | created |
|------|-------|---------------|---------|
${rows.join('\n')}

## Roster (paste into brief prompt)

Replace the fenced slug list in your external Variety Engine **Roster** section with:

\`\`\`
${rosterLines.join('\n')}
\`\`\`
`;

await writeFile(OUT, md, 'utf8');
console.log(`Wrote ${rows.length} sites → ${OUT.replace(/\\/g, '/')}`);
