import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getHtmlEntries(dir, entries = {}) {
  if (!fs.existsSync(dir)) return entries;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file.startsWith('.')) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getHtmlEntries(fullPath, entries);
    } else if (file.endsWith('.html')) {
      const name = path.relative(__dirname, fullPath).replace(/\\/g, '/').replace('.html', '');
      entries[name] = fullPath;
    }
  }
  return entries;
}

export default defineConfig({
  base: './', // Ensures relative paths for GH Pages
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        ...getHtmlEntries(path.resolve(__dirname, 'sites'))
      }
    }
  }
});
