import fs from 'fs';
import path from 'path';
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

async function convertImages() {
  const imagePaths = [];
  walkSync('.', (filePath) => {
    if (/\.(png|jpe?g)$/i.test(filePath)) {
      imagePaths.push(filePath);
    }
  });

  console.log(`Found ${imagePaths.length} images to convert.`);

  for (const imgPath of imagePaths) {
    const ext = path.extname(imgPath);
    const outPath = imgPath.slice(0, -ext.length) + '.webp';
    
    try {
      await sharp(imgPath)
        .webp({ quality: 80 })
        .toFile(outPath);
      
      fs.unlinkSync(imgPath);
      console.log(`Converted and deleted: ${imgPath} -> ${outPath}`);
    } catch (err) {
      console.error(`Failed to convert ${imgPath}:`, err);
    }
  }
}

function updateReferences() {
  const filePaths = [];
  walkSync('.', (filePath) => {
    if (/\.(html|css|js|json|md)$/i.test(filePath) && path.basename(filePath) !== 'qa-report.json' && path.basename(filePath) !== 'qa_sweep.js' && path.basename(filePath) !== 'package.json' && path.basename(filePath) !== 'package-lock.json') {
      filePaths.push(filePath);
    }
  });

  console.log(`Checking ${filePaths.length} text files for image references.`);
  let updatedCount = 0;

  for (const filePath of filePaths) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace .png, .jpg, .jpeg with .webp
    // Be careful to match it gracefully, ensuring it's an extension.
    const newContent = content.replace(/\.(png|jpg|jpeg)/gi, '.webp');
    
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
