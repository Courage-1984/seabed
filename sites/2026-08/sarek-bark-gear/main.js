import './style.css';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ------------------------------------------------------------------ *
 * Motion budget 1 — staggered scroll-reveal system.
 * Fires once per element, never re-triggers.
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
  // anchor jump or a programmatic scroll, which would strand them invisible.
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
 * Signature effect — animated SVG line-draw.
 * Each path measures itself, so dash values stay exact regardless of
 * viewBox scaling, then draws in on first intersection.
 * ------------------------------------------------------------------ */
function initEffect() {
  const svg = document.querySelector('[data-line-draw]');
  if (!svg) return;
  const paths = [...svg.querySelectorAll('.draw-path')];
  if (!paths.length) return;

  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    paths.forEach((path) => {
      path.style.strokeDasharray = 'none';
      path.style.strokeDashoffset = '0';
    });
    return;
  }
  paths.forEach((path, i) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    path.style.transitionDelay = `${i * 180}ms`;
  });
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      paths.forEach((path) => {
        path.style.strokeDashoffset = '0';
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(svg);
}

/* ------------------------------------------------------------------ *
 * Video placement — the loop only decodes while it is on screen.
 * Absent until the generated clip is installed, so this is a no-op
 * while the slot still shows its still frame.
 * ------------------------------------------------------------------ */
function initSlotVideo() {
  const video = document.querySelector('[data-slot-video]');
  if (!video) return;

  const apply = () => {
    if (reduceMotion.matches) {
      // Drop the attribute too, so the clip does not restart itself if the
      // element is re-attached or the source reloads.
      video.removeAttribute('autoplay');
      video.pause();
    } else {
      video.play().catch(() => {});
    }
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
  initReveals();
  initEffect();
  initSlotVideo();
});
