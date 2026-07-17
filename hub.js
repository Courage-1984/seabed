// Use import.meta.glob to eagerly load all meta.json files
const sites = import.meta.glob('./sites/*/meta.json', { eager: true });
const images = import.meta.glob('./sites/*/assets/**/*.{jpg,png,jpeg,svg,gif}', { eager: true, query: '?url', import: 'default' });

const grid = document.getElementById('hub-grid');

Object.entries(sites).forEach(([path, meta]) => {
  // path is something like './sites/brand-name/meta.json'
  const siteFolder = path.replace('/meta.json', '');
  const metaData = meta.default || meta;
  const { title, blurb, hero } = metaData;
  
  // Resolve the hashed image URL from Vite's glob
  // Normalize the hero path to match the glob key
  const normalizedHero = hero.replace(/^.\//, '');
  const imageGlobPath = `${siteFolder}/${normalizedHero}`;
  const imagePath = hero.startsWith('/') ? '.' + hero : imageGlobPath;
  const resolvedImageUrl = images[imageGlobPath] || imagePath;
  const faviconGlobPath = `${siteFolder}/assets/favicon.svg`;
  const resolvedFaviconUrl = images[faviconGlobPath] || `${siteFolder}/assets/favicon.svg`;
  
  // Create card element
  const card = document.createElement('a');
  card.href = `${siteFolder}/index.html`;
  card.className = 'card';
  card.target = '_blank';
  
  card.innerHTML = `
    <div class="card-img-wrapper">
      <img src="${resolvedImageUrl}" alt="${title} screenshot" loading="lazy">
    </div>
    <div class="card-content">
      <h2 class="card-title">
        <img src="${resolvedFaviconUrl}" class="card-favicon" alt="favicon" width="24" height="24" style="vertical-align: middle; margin-right: 8px;">
        ${title}
      </h2>
      <p class="card-blurb">${blurb}</p>
      <div class="card-link-text">Visit Project &rarr;</div>
    </div>
  `;
  
  grid.appendChild(card);
});
