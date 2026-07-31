const fs = require('fs');
const path = require('path');
const sitesDir = path.join(process.cwd(), 'sites');
const months = fs.readdirSync(sitesDir).filter((f) => fs.statSync(path.join(sitesDir, f)).isDirectory());
let sites = [];
for (const month of months) {
  const monthDir = path.join(sitesDir, month);
  const slugs = fs.readdirSync(monthDir).filter((f) => fs.statSync(path.join(monthDir, f)).isDirectory());
  for (const slug of slugs) {
    sites.push({ month, slug, dir: path.join(monthDir, slug) });
  }
}
const report = sites.map((site) => {
  const metaPath = path.join(site.dir, 'meta.json');
  let meta = {};
  if (fs.existsSync(metaPath)) {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  }
  const htmlPath = path.join(site.dir, 'index.html');
  let html = '';
  if (fs.existsSync(htmlPath)) {
    html = fs.readFileSync(htmlPath, 'utf8');
  }
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const imgMatches = [];
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    imgMatches.push(match[1]);
  }
  return { slug: site.slug, hero: meta.hero, imgs: imgMatches };
});
fs.writeFileSync('image_audit.json', JSON.stringify(report, null, 2));
