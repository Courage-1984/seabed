// Hub: load sites, sort by created (newest first), render strip + featured + filterable archive
const sites = import.meta.glob('./sites/*/meta.json', { eager: true });
const images = import.meta.glob('./sites/*/assets/**/*.{jpg,png,jpeg,webp,svg,gif}', {
  query: '?url',
  import: 'default',
});

const stripEl = document.getElementById('discovery-strip');
const latestEl = document.getElementById('latest-drop');
const gridEl = document.getElementById('hub-grid');
const filtersEl = document.getElementById('archive-filters');

const RECENT_DAYS = 14;

function formatDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatMonthLabel(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, 1));
  return dt.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function parseCreated(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function daysBetween(a, b) {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

async function loadSiteEntries() {
  const entries = await Promise.all(
    Object.entries(sites).map(async ([path, meta]) => {
      const siteFolder = path.replace('/meta.json', '');
      const metaData = meta.default || meta;
      const { title, blurb, hero, created, layoutFamily } = metaData;

      const normalizedHero = (hero || '').replace(/^\.\//, '');
      const imageGlobPath = `${siteFolder}/${normalizedHero}`;
      const imagePath = hero?.startsWith('/') ? '.' + hero : imageGlobPath;
      const faviconGlobPath = `${siteFolder}/assets/favicon.svg`;

      const [resolvedImageUrl, resolvedFaviconUrl] = await Promise.all([
        images[imageGlobPath] ? images[imageGlobPath]() : Promise.resolve(imagePath),
        images[faviconGlobPath] ? images[faviconGlobPath]() : Promise.resolve(faviconGlobPath),
      ]);

      return {
        siteFolder,
        title: title || 'Untitled',
        blurb: blurb || '',
        created: created || '1970-01-01',
        layoutFamily: String(layoutFamily || '').trim(),
        href: `${siteFolder}/index.html`,
        heroUrl: resolvedImageUrl,
        faviconUrl: resolvedFaviconUrl,
      };
    })
  );

  entries.sort((a, b) => {
    if (a.created !== b.created) return a.created < b.created ? 1 : -1;
    return a.title.localeCompare(b.title);
  });

  return entries;
}

function buildDiscoveryCell(site) {
  const a = document.createElement('a');
  a.href = site.href;
  a.className = 'discovery-cell';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.title = site.title;

  const img = document.createElement('img');
  img.src = site.heroUrl;
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';

  const meta = document.createElement('div');
  meta.className = 'discovery-cell-meta';
  const strong = document.createElement('strong');
  strong.textContent = site.title;
  const span = document.createElement('span');
  span.textContent = formatDate(site.created);
  meta.append(strong, span);

  a.append(img, meta);
  return a;
}

function renderDiscoveryStrip(sorted) {
  const track = document.createElement('div');
  track.className = 'discovery-track';
  track.setAttribute('aria-hidden', 'false');

  const sequence = [...sorted, ...sorted];
  for (const site of sequence) {
    track.appendChild(buildDiscoveryCell(site));
  }

  stripEl.replaceChildren(track);
}

function renderLatestDrop(site) {
  if (!site) {
    latestEl.replaceChildren();
    return;
  }

  const inner = document.createElement('div');
  inner.className = 'latest-drop-inner';

  const bg = document.createElement('div');
  bg.className = 'latest-drop-bg';
  bg.style.backgroundImage = `url("${site.heroUrl}")`;
  bg.setAttribute('role', 'img');
  bg.setAttribute('aria-label', `${site.title} hero`);

  const copy = document.createElement('div');
  copy.className = 'latest-drop-copy';

  const label = document.createElement('p');
  label.className = 'latest-drop-label';
  label.textContent = 'Latest drop';

  const h2 = document.createElement('h2');
  h2.textContent = site.title;

  const blurb = document.createElement('p');
  blurb.textContent = site.blurb;

  const date = document.createElement('p');
  date.className = 'latest-drop-date';
  date.textContent = formatDate(site.created);

  const cta = document.createElement('a');
  cta.href = site.href;
  cta.className = 'latest-drop-cta';
  cta.target = '_blank';
  cta.rel = 'noopener noreferrer';
  cta.textContent = 'Open build';

  copy.append(label, h2, blurb, date, cta);
  inner.append(bg, copy);
  latestEl.replaceChildren(inner);
}

function uniqueLayoutFamilies(siteList) {
  const set = new Set();
  for (const site of siteList) {
    if (site.layoutFamily) set.add(site.layoutFamily);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function filterSites(siteList, filter, newestDate) {
  if (filter === 'all') return siteList;
  if (filter === 'recent') {
    if (!newestDate) return siteList;
    return siteList.filter((site) => {
      const d = parseCreated(site.created);
      return d && daysBetween(d, newestDate) <= RECENT_DAYS;
    });
  }
  return siteList.filter((site) => site.layoutFamily === filter);
}

function archiveSpanClass(index) {
  const n = index % 6;
  if (n === 0) return 'archive-card--wide';
  if (n === 3) return 'archive-card--tall';
  return '';
}

function renderArchiveCard(site, index) {
  const card = document.createElement('a');
  card.href = site.href;
  card.className = `archive-card ${archiveSpanClass(index)}`.trim();
  card.style.setProperty('--i', String(index));
  card.target = '_blank';
  card.rel = 'noopener noreferrer';

  const media = document.createElement('div');
  media.className = 'archive-card-media';
  const heroImg = document.createElement('img');
  heroImg.src = site.heroUrl;
  heroImg.alt = `${site.title} screenshot`;
  heroImg.loading = 'lazy';
  media.appendChild(heroImg);

  const body = document.createElement('div');
  body.className = 'archive-card-body';

  const metaRow = document.createElement('div');
  metaRow.className = 'archive-card-meta';
  const time = document.createElement('time');
  time.dateTime = site.created;
  time.textContent = formatDate(site.created);
  const favicon = document.createElement('img');
  favicon.className = 'archive-card-favicon';
  favicon.src = site.faviconUrl;
  favicon.alt = '';
  favicon.width = 18;
  favicon.height = 18;
  favicon.loading = 'lazy';
  metaRow.append(time, favicon);

  const title = document.createElement('h3');
  title.className = 'archive-card-title';
  title.textContent = site.title;

  const pills = document.createElement('div');
  pills.className = 'archive-pills';
  if (site.layoutFamily) {
    const familyPill = document.createElement('span');
    familyPill.className = 'archive-pill';
    familyPill.textContent = site.layoutFamily;
    pills.appendChild(familyPill);
  }
  const month = formatMonthLabel(site.created);
  if (month) {
    const monthPill = document.createElement('span');
    monthPill.className = 'archive-pill archive-pill--muted';
    monthPill.textContent = month;
    pills.appendChild(monthPill);
  }

  const blurbEl = document.createElement('p');
  blurbEl.className = 'archive-card-blurb';
  blurbEl.textContent = site.blurb;

  const cta = document.createElement('span');
  cta.className = 'archive-card-cta';
  cta.textContent = 'Open →';

  body.append(metaRow, title);
  if (pills.childNodes.length) body.appendChild(pills);
  body.append(blurbEl, cta);
  card.append(media, body);
  return card;
}

function observeArchiveCards(cards) {
  const reduce =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    cards.forEach((card) => card.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );

  cards.forEach((card) => io.observe(card));
}

function renderArchive(siteList, filter, newestDate) {
  const filtered = filterSites(siteList, filter, newestDate);
  gridEl.classList.add('is-fading');

  window.setTimeout(() => {
    if (filtered.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'archive-empty';
      empty.textContent = 'No builds in this filter.';
      gridEl.replaceChildren(empty);
    } else {
      const frag = document.createDocumentFragment();
      const cards = filtered.map((site, i) => renderArchiveCard(site, i));
      for (const card of cards) frag.appendChild(card);
      gridEl.replaceChildren(frag);
      observeArchiveCards(cards);
    }
    gridEl.classList.remove('is-fading');
  }, 160);
}

function renderFilters(siteList, activeFilter, onChange) {
  if (!filtersEl) return;

  const families = uniqueLayoutFamilies(siteList);
  const chips = [
    { id: 'all', label: 'All' },
    ...families.map((f) => ({ id: f, label: f })),
    { id: 'recent', label: 'Recent' },
  ];

  filtersEl.hidden = false;
  filtersEl.replaceChildren();

  for (const chip of chips) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'archive-filter-chip';
    btn.dataset.filter = chip.id;
    btn.setAttribute('aria-pressed', chip.id === activeFilter ? 'true' : 'false');
    btn.textContent = chip.label;
    btn.addEventListener('click', () => onChange(chip.id));
    filtersEl.appendChild(btn);
  }
}

const sorted = await loadSiteEntries();
const newestDate = parseCreated(sorted[0]?.created);
let activeFilter = 'all';

const applyFilter = (filter) => {
  activeFilter = filter;
  renderFilters(sorted, activeFilter, applyFilter);
  renderArchive(sorted, activeFilter, newestDate);
};

renderDiscoveryStrip(sorted);
renderLatestDrop(sorted[0]);
applyFilter('all');
