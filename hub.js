// Use import.meta.glob to eagerly load all meta.json files
const sites = import.meta.glob('./sites/*/meta.json', { eager: true });
const images = import.meta.glob('./sites/*/assets/**/*.{jpg,png,jpeg,webp,svg,gif}', { query: '?url', import: 'default' });

const grid = document.getElementById('hub-grid');

const renderCards = async () => {
  const cardPromises = Object.entries(sites).map(async ([path, meta]) => {
    // path is something like './sites/brand-name/meta.json'
    const siteFolder = path.replace('/meta.json', '');
    const metaData = meta.default || meta;
    const { title, blurb, hero } = metaData;
    
    // Normalize the hero path to match the glob key
    const normalizedHero = hero.replace(/^.\//, '');
    const imageGlobPath = `${siteFolder}/${normalizedHero}`;
    const imagePath = hero.startsWith('/') ? '.' + hero : imageGlobPath;
    
    const faviconGlobPath = `${siteFolder}/assets/favicon.svg`;

    const [resolvedImageUrl, resolvedFaviconUrl] = await Promise.all([
      images[imageGlobPath] ? images[imageGlobPath]() : Promise.resolve(imagePath),
      images[faviconGlobPath] ? images[faviconGlobPath]() : Promise.resolve(faviconGlobPath)
    ]);
    
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
    return card;
  });

  const cards = await Promise.all(cardPromises);
  cards.forEach(card => grid.appendChild(card));
};

renderCards();
