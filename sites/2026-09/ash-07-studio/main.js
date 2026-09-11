import './style.css';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

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
 * Signature effect — CSS 3D card tilt.
 * Masonry tiles tilt toward the pointer with perspective and a moving
 * specular highlight. Pointer-fine only; touch and reduced motion opt out.
 * ------------------------------------------------------------------ */
const MAX_TILT = 7; // degrees

function initCardTilt() {
  const tiles = [...document.querySelectorAll('.masonry-tile')];
  if (!tiles.length) return;

  const enabled = () => finePointer.matches && !reduceMotion.matches;

  const reset = (tile) => {
    tile.style.removeProperty('--tilt-x');
    tile.style.removeProperty('--tilt-y');
    tile.style.removeProperty('--glare-x');
    tile.style.removeProperty('--glare-y');
    tile.classList.remove('is-tilting');
  };

  for (const tile of tiles) {
    let frame = null;
    let pending = null;

    const apply = () => {
      frame = null;
      if (!pending) return;
      const { rect, x, y } = pending;
      const px = (x - rect.left) / rect.width; // 0..1
      const py = (y - rect.top) / rect.height;
      tile.style.setProperty('--tilt-y', `${(px - 0.5) * 2 * MAX_TILT}deg`);
      tile.style.setProperty('--tilt-x', `${(0.5 - py) * 2 * MAX_TILT}deg`);
      tile.style.setProperty('--glare-x', `${px * 100}%`);
      tile.style.setProperty('--glare-y', `${py * 100}%`);
    };

    tile.addEventListener(
      'pointermove',
      (event) => {
        if (!enabled()) return;
        tile.classList.add('is-tilting');
        pending = { rect: tile.getBoundingClientRect(), x: event.clientX, y: event.clientY };
        if (frame === null) frame = requestAnimationFrame(apply);
      },
      { passive: true }
    );

    tile.addEventListener('pointerleave', () => reset(tile));
    // Keyboard users get the lifted state without a pointer position.
    tile.addEventListener('focusin', () => tile.classList.add('is-tilting'));
    tile.addEventListener('focusout', () => reset(tile));
  }

  const onPreferenceChange = () => tiles.forEach(reset);
  reduceMotion.addEventListener('change', onPreferenceChange);
  finePointer.addEventListener('change', onPreferenceChange);
}

/* ------------------------------------------------------------------ *
 * Video placement — inline process demo.
 * A demo player, so it does not autoplay; it simply stops decoding once
 * it leaves the viewport.
 * ------------------------------------------------------------------ */
function initProcessDemo() {
  const video = document.querySelector('.process-demo__video');
  if (!video || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting && !video.paused) video.pause();
    },
    { threshold: 0 }
  );
  observer.observe(video);
}

/* ------------------------------------------------------------------ *
 * Supporting motion — kiln telemetry ember only pulses while visible.
 * ------------------------------------------------------------------ */
function initTelemetry() {
  const strip = document.querySelector('.hero-telemetry');
  if (!strip || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(([entry]) => strip.classList.toggle('is-live', entry.isIntersecting), {
    threshold: 0,
  });
  observer.observe(strip);
}

document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initCardTilt();
  initProcessDemo();
  initTelemetry();
});
