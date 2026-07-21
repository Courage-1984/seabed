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
    const normalizedHero = hero.replace(/^\.\//, '');
    const imageGlobPath = `${siteFolder}/${normalizedHero}`;
    const imagePath = hero.startsWith('/') ? '.' + hero : imageGlobPath;

    const faviconGlobPath = `${siteFolder}/assets/favicon.svg`;

    const [resolvedImageUrl, resolvedFaviconUrl] = await Promise.all([
      images[imageGlobPath] ? images[imageGlobPath]() : Promise.resolve(imagePath),
      images[faviconGlobPath] ? images[faviconGlobPath]() : Promise.resolve(faviconGlobPath)
    ]);

    const card = document.createElement('a');
    card.href = `${siteFolder}/index.html`;
    card.className = 'card';
    card.target = '_blank';

    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'card-img-wrapper';
    const heroImg = document.createElement('img');
    heroImg.src = resolvedImageUrl;
    heroImg.alt = `${title} screenshot`;
    heroImg.loading = 'lazy';
    imgWrapper.appendChild(heroImg);

    const content = document.createElement('div');
    content.className = 'card-content';

    const heading = document.createElement('h2');
    heading.className = 'card-title';
    const favicon = document.createElement('img');
    favicon.src = resolvedFaviconUrl;
    favicon.className = 'card-favicon';
    favicon.alt = 'favicon';
    favicon.width = 24;
    favicon.height = 24;
    favicon.style.verticalAlign = 'middle';
    favicon.style.marginRight = '8px';
    heading.appendChild(favicon);
    heading.appendChild(document.createTextNode(title));

    const blurbEl = document.createElement('p');
    blurbEl.className = 'card-blurb';
    blurbEl.textContent = blurb;

    const linkText = document.createElement('div');
    linkText.className = 'card-link-text';
    linkText.textContent = 'Visit Project →';

    content.append(heading, blurbEl, linkText);
    card.append(imgWrapper, content);
    return card;
  });

  const cards = await Promise.all(cardPromises);
  cards.forEach((card) => grid.appendChild(card));
};

renderCards();
