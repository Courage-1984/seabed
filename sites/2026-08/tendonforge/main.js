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
 * Signature effect — magnetic proximity cursor element.
 * Marked controls drift toward the pointer within a radius and ease
 * back on leave. Pointer-fine only; touch and reduced motion opt out.
 * ------------------------------------------------------------------ */
const MAGNET_RADIUS = 130;
const MAGNET_PULL = 0.3;

function initMagnetic() {
  const magnets = [...document.querySelectorAll('[data-magnetic]')];
  if (!magnets.length) return;

  const enabled = () => finePointer.matches && !reduceMotion.matches;

  const reset = (el) => {
    el.style.removeProperty('--magnet-x');
    el.style.removeProperty('--magnet-y');
    el.classList.remove('is-magnetised');
  };

  if (!enabled()) magnets.forEach(reset);

  let frame = null;
  let pointer = { x: 0, y: 0 };

  const update = () => {
    frame = null;
    for (const el of magnets) {
      const r = el.getBoundingClientRect();
      const dx = pointer.x - (r.left + r.width / 2);
      const dy = pointer.y - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < MAGNET_RADIUS + Math.max(r.width, r.height) / 2) {
        el.style.setProperty('--magnet-x', `${dx * MAGNET_PULL}px`);
        el.style.setProperty('--magnet-y', `${dy * MAGNET_PULL}px`);
        el.classList.add('is-magnetised');
      } else if (el.classList.contains('is-magnetised')) {
        reset(el);
      }
    }
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      if (!enabled()) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (frame === null) frame = requestAnimationFrame(update);
    },
    { passive: true }
  );

  // Keyboard users get the same affordance without a pointer.
  magnets.forEach((el) => {
    el.addEventListener('focus', () => el.classList.add('is-magnetised'));
    el.addEventListener('blur', () => reset(el));
  });

  const onPreferenceChange = () => magnets.forEach(reset);
  reduceMotion.addEventListener('change', onPreferenceChange);
  finePointer.addEventListener('change', onPreferenceChange);
}

/* ------------------------------------------------------------------ *
 * Video placement — masked type fill.
 * The band shows a still until the generated clip is installed; once a
 * <video> is present it plays only while the band is on screen.
 * ------------------------------------------------------------------ */
function initMaskedType() {
  const video = document.querySelector('.masked-type__video');
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
  initMagnetic();
  initMaskedType();
});
