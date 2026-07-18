import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import sharp from 'sharp';

const IGNORE_DIRS = ['node_modules', 'dist', 'qa-screenshots', 'qa-visual', '.git', 'scripts', '.github'];

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        walkSync(fullPath, callback);
      }
    } else {
      callback(fullPath);
    }
  }
}

async function optimizeHtml() {
  const filePaths = [];
  walkSync('.', (filePath) => {
    if (/\.html$/i.test(filePath)) {
      filePaths.push(filePath);
    }
  });

  for (const filePath of filePaths) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(content, { decodeEntities: false });
    let modified = false;

    const imgElements = $('img').toArray();
    for (const el of imgElements) {
      const $img = $(el);
      const src = $img.attr('src');
      if (!src) continue;

      // Ensure loading="lazy" unless it's a hero image or has fetchpriority
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
      } else {
        if ($img.attr('loading') !== 'lazy') {
          $img.attr('loading', 'lazy');
          modified = true;
        }
      }

      // Read image dimensions if src is local
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        let absPath = '';
        if (src.startsWith('/')) {
            absPath = path.join('public', src);
        } else {
            absPath = path.resolve(path.dirname(filePath), src);
        }

        try {
          if (fs.existsSync(absPath)) {
            if (!$img.attr('width') || !$img.attr('height')) {
              const metadata = await sharp(absPath).metadata();
              if (metadata.width && metadata.height) {
                if (!$img.attr('width')) $img.attr('width', metadata.width.toString());
                if (!$img.attr('height')) $img.attr('height', metadata.height.toString());
                modified = true;
              }
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

optimizeHtml().then(() => console.log('Done optimizing HTML!')).catch(console.error);
