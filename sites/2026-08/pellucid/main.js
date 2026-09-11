import './style.css';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ------------------------------------------------------------------ *
 * Layout family signature — layered parallax.
 * Depth planes move at distinct scroll rates. Reduced motion pins them.
 * ------------------------------------------------------------------ */
function initParallax() {
  const layers = [...document.querySelectorAll('[data-speed]')];
  if (!layers.length) return;

  if (reduceMotion.matches) {
    layers.forEach((el) => {
      el.style.transform = 'none';
    });
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const scrollY = window.scrollY;
    for (const el of layers) {
      const speed = parseFloat(el.getAttribute('data-speed'));
      el.style.transform = `translate3d(0, ${scrollY * (1 - speed)}px, 0)`;
    }
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );
  update();
}

/* ------------------------------------------------------------------ *
 * Motion budget 1 — staggered scroll-reveal system.
 * Applied only to elements the parallax system does not already own,
 * since both would otherwise compete for `transform`.
 * ------------------------------------------------------------------ */
function initReveals() {
  const targets = [...document.querySelectorAll('[data-reveal]')];
  if (!targets.length) return;

  // Only hide content once we know JS is running and can bring it back. If the
  // script fails to load the page renders un-animated instead of blank.
  document.documentElement.classList.add('js-reveal');

  const show = (el) => {
    if (el.classList.contains('is-revealed')) return;
    const group = el.parentElement;
    const siblings = group ? [...group.querySelectorAll('[data-reveal]')] : [el];
    const step = Math.max(0, siblings.indexOf(el));
    el.style.setProperty('--reveal-delay', `${step * 80}ms`);
    el.classList.add('is-revealed');
  };

  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    targets.forEach(show);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
  );

  targets.forEach((el) => observer.observe(el));

  // Backstop: the observer can miss elements that arrive in view through an
  // anchor jump or a programmatic scroll.
  const sweep = () => {
    for (const el of targets) {
      if (el.classList.contains('is-revealed')) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        show(el);
        observer.unobserve(el);
      }
    }
  };
  window.addEventListener('scroll', sweep, { passive: true });
  window.addEventListener('resize', sweep, { passive: true });
  window.addEventListener('hashchange', () => setTimeout(sweep, 600));
  setTimeout(sweep, 400);
}

/* ------------------------------------------------------------------ *
 * Signature effect — scroll-driven clip-path wipe.
 * The transition band is revealed by animating clip-path against scroll
 * progress rather than fading, so the footage wipes into view.
 * ------------------------------------------------------------------ */
function initClipWipe() {
  const band = document.querySelector('[data-transition-band]');
  if (!band) return;

  if (reduceMotion.matches) {
    band.style.setProperty('--wipe', '100%');
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = band.getBoundingClientRect();
    // 0 as the band enters from below, 1 once it has cleared the fold.
    const raw = (window.innerHeight - rect.top) / (window.innerHeight * 0.65);
    const progress = Math.min(1, Math.max(0, raw));
    band.style.setProperty('--wipe', `${(progress * 100).toFixed(1)}%`);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ------------------------------------------------------------------ *
 * Video placement — section transition band.
 * The loop only decodes while the band is on screen.
 * ------------------------------------------------------------------ */
function initBandVideo() {
  const video = document.querySelector('.transition-band__video');
  if (!video) return;

  const apply = () => {
    if (reduceMotion.matches) video.pause();
    else video.play().catch(() => {});
  };
  reduceMotion.addEventListener('change', apply);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reduceMotion.matches) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.05 }
    );
    observer.observe(video);
  }
  apply();
}

document.addEventListener('DOMContentLoaded', () => {
  initParallax();
  initReveals();
  initClipWipe();
  initBandVideo();
});
