#!/usr/bin/env node
/**
 * Convert PNG/JPEG under the repo (or one site) to WebP and rewrite path-like refs.
 * Usage: node scripts/convert-webp.js [--slug <slug>]
 */
import fs from 'fs';
import path from 'path';
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
      console.error('Usage: node scripts/convert-webp.js [--slug <slug>]');
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

async function convertImages() {
  const imagePaths = [];
  walkSync(root, (filePath) => {
    if (/\.(png|jpe?g)$/i.test(filePath)) imagePaths.push(filePath);
  });

  console.log(`Found ${imagePaths.length} images to convert under ${root}.`);

  for (const imgPath of imagePaths) {
    const ext = path.extname(imgPath);
    const outPath = imgPath.slice(0, -ext.length) + '.webp';
    try {
      await sharp(imgPath).webp({ quality: 80 }).toFile(outPath);
      fs.unlinkSync(imgPath);
      console.log(`Converted and deleted: ${imgPath} -> ${outPath}`);
    } catch (err) {
      console.error(`Failed to convert ${imgPath}:`, err);
    }
  }
}

function updateReferences() {
  const filePaths = [];
  const skipNames = new Set(['qa-report.json', 'package.json', 'package-lock.json']);
  walkSync(root, (filePath) => {
    if (/\.(html|css|js|json)$/i.test(filePath) && !skipNames.has(path.basename(filePath))) {
      filePaths.push(filePath);
    }
  });

  console.log(`Checking ${filePaths.length} text files for image path references.`);
  let updatedCount = 0;

  // Path-like refs only: assets/foo.png, ./bar.jpg, url(...), src="..."
  const pathExtRe =
    /((?:(?:\.\/|\.\.\/|\/)?(?:[\w.-]+\/)*)[\w.-]+)\.(png|jpg|jpeg)(?=["')\s?]|$)/gi;

  for (const filePath of filePaths) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const newContent = content.replace(pathExtRe, '$1.webp');
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`Updated references in: ${filePath}`);
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} files.`);
}

async function main() {
  await convertImages();
  updateReferences();
  console.log('Done!');
}

main();
