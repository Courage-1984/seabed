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
      const { title, blurb, hero, created, layoutFamily, tags } = metaData;

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
        tags: Array.isArray(tags) ? tags : [],
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
  img.className = 'discovery-cell-hero';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.draggable = false;

  const meta = document.createElement('div');
  meta.className = 'discovery-cell-meta';

  const metaTop = document.createElement('div');
  metaTop.className = 'discovery-cell-meta-top';
  const favicon = document.createElement('img');
  favicon.src = site.faviconUrl;
  favicon.className = 'discovery-cell-favicon';
  favicon.alt = '';
  favicon.loading = 'lazy';
  const strong = document.createElement('strong');
  strong.textContent = site.title;
  metaTop.append(favicon, strong);

  const span = document.createElement('span');
  span.textContent = formatDate(site.created);
  
  meta.append(metaTop, span);

  a.append(img, meta);
  return a;
}

function renderDiscoveryStrip(sorted) {
  const track = document.createElement('div');
  track.className = 'discovery-track';

  for (const site of sorted) {
    track.appendChild(buildDiscoveryCell(site));
  }

  stripEl.replaceChildren(track);

  // Setup Carousel Logic
  const prevBtn = document.getElementById('discovery-prev');
  const nextBtn = document.getElementById('discovery-next');
  const dotsContainer = document.getElementById('discovery-dots');

  // Generate dots
  if (dotsContainer) {
    const dotsFrag = document.createDocumentFragment();
    sorted.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'discovery-dot';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.addEventListener('click', () => {
        const cellWidth = track.children[0]?.offsetWidth || 0;
        const gap = 16;
        stripEl.scrollTo({ left: i * (cellWidth + gap), behavior: 'smooth' });
      });
      dotsFrag.appendChild(dot);
    });
    dotsContainer.replaceChildren(dotsFrag);
  }

  // Update dots and buttons on scroll
  const updateState = () => {
    const cellWidth = track.children[0]?.offsetWidth || 0;
    const gap = 16;
    const itemWidth = cellWidth + gap;
    const index = Math.round(stripEl.scrollLeft / itemWidth);
    
    if (dotsContainer) {
      Array.from(dotsContainer.children).forEach((dot, i) => {
        dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
    }

    if (prevBtn) prevBtn.disabled = stripEl.scrollLeft <= 0;
    if (nextBtn) nextBtn.disabled = stripEl.scrollLeft >= stripEl.scrollWidth - stripEl.clientWidth - 10;
  };

  stripEl.addEventListener('scroll', updateState, { passive: true });
  window.addEventListener('resize', updateState, { passive: true });
  updateState();

  // Navigation Arrows
  const scrollByAmount = () => (track.children[0]?.offsetWidth || 0) + 16;
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      stripEl.scrollBy({ left: -scrollByAmount(), behavior: 'smooth' });
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      stripEl.scrollBy({ left: scrollByAmount(), behavior: 'smooth' });
    });
  }

  // Drag to scroll
  let isDown = false;
  let startX;
  let scrollLeft;

  stripEl.addEventListener('mousedown', (e) => {
    isDown = true;
    stripEl.style.scrollBehavior = 'auto'; // disable smooth snap while dragging
    stripEl.style.scrollSnapType = 'none';
    startX = e.pageX - stripEl.offsetLeft;
    scrollLeft = stripEl.scrollLeft;
  });

  const endDrag = () => {
    if (!isDown) return;
    isDown = false;
    stripEl.style.scrollBehavior = 'smooth';
    stripEl.style.scrollSnapType = 'x mandatory';
    // snap to nearest
    const cellWidth = track.children[0]?.offsetWidth || 0;
    const gap = 16;
    const index = Math.round(stripEl.scrollLeft / (cellWidth + gap));
    stripEl.scrollTo({ left: index * (cellWidth + gap), behavior: 'smooth' });
  };

  stripEl.addEventListener('mouseleave', endDrag);
  stripEl.addEventListener('mouseup', endDrag);
  stripEl.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - stripEl.offsetLeft;
    const walk = (x - startX) * 1.5; // scrolling speed
    stripEl.scrollLeft = scrollLeft - walk;
  });

  // Shift + Scroll wheel support (some browsers do this natively, but this ensures it)
  stripEl.addEventListener('wheel', (e) => {
    if (!e.shiftKey && e.deltaY !== 0) {
      e.preventDefault();
      stripEl.style.scrollBehavior = 'auto';
      stripEl.scrollBy({ left: e.deltaY > 0 ? 100 : -100 });
      // Restore snap after a short delay
      clearTimeout(stripEl._wheelTimeout);
      stripEl._wheelTimeout = setTimeout(() => {
        stripEl.style.scrollBehavior = 'smooth';
        endDrag();
      }, 150);
    }
  }, { passive: false });

  // Auto Scroll Logic
  let autoScrollInterval;
  const startAutoScroll = () => {
    clearInterval(autoScrollInterval);
    autoScrollInterval = setInterval(() => {
      if (isDown) return; // don't scroll if dragging
      if (stripEl.scrollLeft >= stripEl.scrollWidth - stripEl.clientWidth - 10) {
        stripEl.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        stripEl.scrollBy({ left: scrollByAmount(), behavior: 'smooth' });
      }
    }, 3500);
  };

  const stopAutoScroll = () => clearInterval(autoScrollInterval);

  const carouselSection = stripEl.closest('.discovery');
  if (carouselSection) {
    carouselSection.addEventListener('mouseenter', stopAutoScroll);
    carouselSection.addEventListener('mouseleave', startAutoScroll);
  }
  
  startAutoScroll();
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

function uniqueTags(siteList) {
  const set = new Set();
  for (const site of siteList) {
    if (site.tags) site.tags.forEach(t => set.add(t));
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function filterSites(siteList, category, subFilter, newestDate) {
  if (category === 'all') return siteList;
  if (category === 'recent') {
    if (!newestDate) return siteList;
    return siteList.filter((site) => {
      const d = parseCreated(site.created);
      return d && daysBetween(d, newestDate) <= RECENT_DAYS;
    });
  }
  if (category === 'layout' && subFilter) {
    return siteList.filter((site) => site.layoutFamily === subFilter);
  }
  if (category === 'tag' && subFilter) {
    return siteList.filter((site) => site.tags && site.tags.includes(subFilter));
  }
  return siteList;
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
  if (site.tags && site.tags.length > 0) {
    site.tags.forEach(tag => {
      const tagPill = document.createElement('span');
      tagPill.className = 'archive-pill archive-pill--muted';
      tagPill.textContent = '#' + tag;
      pills.appendChild(tagPill);
    });
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

function renderArchive(siteList, category, subFilter, newestDate) {
  const filtered = filterSites(siteList, category, subFilter, newestDate);
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

function renderFilters(siteList, onChange) {
  if (!filtersEl) return;
  filtersEl.hidden = false;
  filtersEl.replaceChildren();

  // Category Row
  const catRow = document.createElement('div');
  catRow.className = 'archive-filter-row';
  
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'recent', label: 'Recent' },
    { id: 'layout', label: 'By Layout' },
    { id: 'tag', label: 'By Tag' },
  ];
  
  for (const cat of categories) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'archive-filter-chip';
    btn.dataset.category = cat.id;
    btn.setAttribute('aria-pressed', cat.id === activeCategory ? 'true' : 'false');
    btn.textContent = cat.label;
    btn.addEventListener('click', () => onChange(cat.id, null));
    catRow.appendChild(btn);
  }
  filtersEl.appendChild(catRow);

  // Sub-filter Row
  if (activeCategory === 'layout' || activeCategory === 'tag') {
    const subRow = document.createElement('div');
    subRow.className = 'archive-filter-row archive-filter-row--sub';
    
    const items = activeCategory === 'layout' 
      ? uniqueLayoutFamilies(siteList).map(f => ({ id: f, label: f }))
      : uniqueTags(siteList).map(t => ({ id: t, label: '#' + t }));

    for (const item of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'archive-filter-chip archive-filter-chip--sub';
      btn.setAttribute('aria-pressed', item.id === activeSubFilter ? 'true' : 'false');
      btn.textContent = item.label;
      btn.addEventListener('click', () => onChange(activeCategory, item.id));
      subRow.appendChild(btn);
    }
    filtersEl.appendChild(subRow);
  }
}

const sorted = await loadSiteEntries();
const newestDate = parseCreated(sorted[0]?.created);

let activeCategory = 'all';
let activeSubFilter = null;

const applyFilter = (category, subFilter = null) => {
  activeCategory = category;
  activeSubFilter = subFilter;

  // If a category is selected but no subfilter is active, default to the first one so it's not empty
  if (category === 'layout' && !subFilter) {
    const families = uniqueLayoutFamilies(sorted);
    if (families.length) activeSubFilter = families[0];
  }
  if (category === 'tag' && !subFilter) {
    const tags = uniqueTags(sorted);
    if (tags.length) activeSubFilter = tags[0];
  }

  renderFilters(sorted, applyFilter);
  renderArchive(sorted, activeCategory, activeSubFilter, newestDate);
};

renderDiscoveryStrip(sorted);
renderLatestDrop(sorted[0]);
applyFilter('all');
