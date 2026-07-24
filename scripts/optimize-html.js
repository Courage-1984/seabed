#!/usr/bin/env node
/**
 * Lazy-load / dimensions for HTML images.
 * Usage: node scripts/optimize-html.js [--slug <slug>]
 */
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import sharp from 'sharp';

const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  'qa-screenshots',
  'qa-visual',
  '.git',
  'scripts',
  '.github',
  '.agents',
  '.firecrawl',
]);

function parseArgs(argv) {
  let slug = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--slug') slug = argv[++i];
    else {
      console.error(`Unknown arg: ${argv[i]}`);
      console.error('Usage: node scripts/optimize-html.js [--slug <slug>]');
      process.exit(2);
    }
  }
  return { slug };
}

const { slug } = parseArgs(process.argv.slice(2));
const root = slug ? path.join('sites', slug) : '.';

if (slug && !fs.existsSync(root)) {
  console.error(`sites/${slug}/ not found`);
  process.exit(1);
}

function walkSync(dir, callback) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (IGNORE_DIRS.has(file)) continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) walkSync(fullPath, callback);
    else callback(fullPath);
  }
}

async function optimizeHtml() {
  const filePaths = [];
  walkSync(root, (filePath) => {
    if (/\.html$/i.test(filePath)) filePaths.push(filePath);
  });

  console.log(`Optimizing ${filePaths.length} HTML file(s) under ${root}.`);

  for (const filePath of filePaths) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(content, { decodeEntities: false });
    let modified = false;

    for (const el of $('img').toArray()) {
      const $img = $(el);
      const src = $img.attr('src');
      if (!src) continue;

      const cls = $img.attr('class') || '';
      const isHero = cls.includes('hero') || src.includes('hero') || $img.attr('fetchpriority') === 'high';

      if (isHero) {
        if ($img.attr('loading') === 'lazy') {
          $img.removeAttr('loading');
          modified = true;
        }
        if ($img.attr('loading') !== 'eager' && $img.attr('fetchpriority') !== 'high') {
          $img.attr('fetchpriority', 'high');
          modified = true;
        }
      } else if ($img.attr('loading') !== 'lazy') {
        $img.attr('loading', 'lazy');
        modified = true;
      }

      if (!src.startsWith('http') && !src.startsWith('data:')) {
        let absPath = '';
        if (src.startsWith('/')) absPath = path.join('public', src);
        else absPath = path.resolve(path.dirname(filePath), src);

        try {
          if (fs.existsSync(absPath) && (!$img.attr('width') || !$img.attr('height'))) {
            const metadata = await sharp(absPath).metadata();
            if (metadata.width && metadata.height) {
              if (!$img.attr('width')) $img.attr('width', metadata.width.toString());
              if (!$img.attr('height')) $img.attr('height', metadata.height.toString());
              modified = true;
            }
          }
        } catch (e) {
          console.error(`Failed to read dimensions for ${absPath}: ${e.message}`);
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, $.html(), 'utf-8');
      console.log(`Optimized: ${filePath}`);
    }
  }
}

optimizeHtml()
  .then(() => console.log('Done optimizing HTML!'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
