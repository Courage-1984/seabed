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
 * Signature effect — text scramble decode on reveal.
 * Each target resolves from random glyphs to its real text once, when
 * it first enters view. The original string is captured before the
 * first frame so a mid-animation reflow can never lose the content.
 * ------------------------------------------------------------------ */
const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#$%&*';

function initEffect() {
  const targets = [...document.querySelectorAll('[data-scramble]')];
  if (!targets.length) return;

  // Captured up front: the element's text is the source of truth, and the
  // animation overwrites it.
  const original = new WeakMap();
  for (const el of targets) original.set(el, el.textContent);

  if (reduceMotion.matches || !('IntersectionObserver' in window)) return;

  const decode = (el) => {
    const text = original.get(el);
    if (!text) return;
    const total = 28; // frames
    let frame = 0;
    const tick = () => {
      // Characters lock in left to right across the run.
      const locked = Math.floor((frame / total) * text.length);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        // Whitespace is never scrambled, so the line keeps its shape.
        if (i < locked || /\s/.test(ch)) out += ch;
        else out += SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
      }
      el.textContent = out;
      frame += 1;
      if (frame <= total) {
        requestAnimationFrame(tick);
      } else {
        // Always restore the exact original, never the last random frame.
        el.textContent = text;
      }
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        decode(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );
  targets.forEach((el) => observer.observe(el));
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
