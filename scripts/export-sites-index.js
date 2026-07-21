#!/usr/bin/env node
/**
 * Regenerates .agents/prompts/_sites-index.md from sites meta.json files.
 * Operator pastes the output block into Gemini Scheduled Action instructions (~weekly).
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
    rows.push(`| ${slug} | ${meta.title ?? '—'} | ${layout} |`);
  } catch {
    rows.push(`| ${slug} | — | — |`);
  }
}

const md = `<!-- GENERATED — paste the "Existing sites" section below into Gemini Scheduled Action instructions (~weekly).
     Regenerate: npm run sites:index
     Cadence: manual-weekly (see audit GT-AUD-GOV-20260721 §F-8) -->

## Existing sites (collision reference)

| slug | title | layout-family |
|------|-------|---------------|
${rows.join('\n')}
`;

await writeFile(OUT, md, 'utf8');
console.log(`Wrote ${rows.length} sites → ${OUT.replace(/\\/g, '/')}`);
