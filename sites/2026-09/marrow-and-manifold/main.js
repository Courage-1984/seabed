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
  // anchor jump or a programmatic scroll. Anything intersecting the viewport is
  // revealed regardless, so content can never be stranded invisible.
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
 * Signature effect — text scramble decode on reveal.
 * Characters cycle through a glyph set and settle into the final
 * string ONCE, on first intersection. Matches the readout aesthetic.
 * ------------------------------------------------------------------ */
const GLYPHS = '/\\|_-=+*^<>[]{}#%@0123456789';

function scramble(el, done) {
  const finalText = el.dataset.scrambleText;
  const chars = [...finalText];
  // Each character resolves at its own moment, left-biased.
  const settleAt = chars.map((_, i) => Math.round(i * 1.6) + Math.floor(Math.random() * 10));
  const totalFrames = Math.max(...settleAt) + 8;
  let frame = 0;

  const tick = () => {
    let out = '';
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === ' ' || frame >= settleAt[i]) out += ch;
      else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    el.textContent = out;
    frame++;
    if (frame <= totalFrames) requestAnimationFrame(tick);
    else {
      el.textContent = finalText;
      el.classList.add('is-decoded');
      if (done) done();
    }
  };
  requestAnimationFrame(tick);
}

function initScramble() {
  const targets = document.querySelectorAll('[data-scramble]');
  if (!targets.length) return;

  targets.forEach((el) => {
    el.dataset.scrambleText = el.textContent.trim();
  });

  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-decoded'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        scramble(entry.target);
      });
    },
    { threshold: 0.4 }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ------------------------------------------------------------------ *
 * Video placement — hero background.
 * Pause the loop when the hero scrolls away or motion is reduced.
 * ------------------------------------------------------------------ */
function initHeroVideo() {
  const video = document.querySelector('.hero-video');
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

/* ------------------------------------------------------------------ *
 * Supporting motion — section id counters tick up as they enter.
 * ------------------------------------------------------------------ */
function initSectionMarkers() {
  if (!('IntersectionObserver' in window)) return;
  const sections = document.querySelectorAll('.section[id]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-current', entry.isIntersecting));
    },
    { rootMargin: '-45% 0px -45% 0px' }
  );
  sections.forEach((s) => observer.observe(s));
}

document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initScramble();
  initHeroVideo();
  initSectionMarkers();
});
