import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Basic interaction for mobile nav could go here if needed,
  // but the spec calls for a mostly static editorial site.
  console.log('Halyard & Hemp Sailmakers - Loft loaded.');
});

/* ================================================================== *
 * Contract v2.1 motion system.
 * Appended rather than replacing this file: the site's own behaviour
 * above is still live. The reveal system keys off `data-reveal` and
 * `is-revealed`, so it does not collide with any existing observer.
 * ================================================================== */
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
 * Signature effect — magnetic proximity cursor element.
 * Targets lean towards the pointer once it is inside their pull radius
 * and spring back when it leaves. Pointer-driven, so it is skipped
 * entirely on touch, where there is no cursor to be attracted to.
 * ------------------------------------------------------------------ */
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

function initEffect() {
  const targets = [...document.querySelectorAll('[data-magnetic]')];
  if (!targets.length) return;

  const RADIUS = 120; // px beyond the element's box that still pulls
  const PULL = 0.28; // fraction of the offset the element travels

  const reset = () => {
    targets.forEach((el) => {
      el.style.setProperty('--magnet-x', '0px');
      el.style.setProperty('--magnet-y', '0px');
    });
  };

  if (reduceMotion.matches || !finePointer.matches) {
    reset();
    return;
  }

  let pointer = null;
  let ticking = false;

  const update = () => {
    ticking = false;
    if (!pointer) return;
    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) continue;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = pointer.x - cx;
      const dy = pointer.y - cy;
      // Distance to the box, not to its centre, so wide elements behave.
      const gapX = Math.max(0, Math.abs(dx) - rect.width / 2);
      const gapY = Math.max(0, Math.abs(dy) - rect.height / 2);
      const gap = Math.hypot(gapX, gapY);
      if (gap > RADIUS) {
        el.style.setProperty('--magnet-x', '0px');
        el.style.setProperty('--magnet-y', '0px');
        continue;
      }
      const strength = (1 - gap / RADIUS) * PULL;
      el.style.setProperty('--magnet-x', `${(dx * strength).toFixed(2)}px`);
      el.style.setProperty('--magnet-y', `${(dy * strength).toFixed(2)}px`);
    }
  };

  const onMove = (event) => {
    pointer = { x: event.clientX, y: event.clientY };
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('scroll', onMove.bind(null, { clientX: -9999, clientY: -9999 }), {
    passive: true,
  });
  window.addEventListener('blur', reset);
  finePointer.addEventListener('change', (e) => {
    if (!e.matches) reset();
  });
  reduceMotion.addEventListener('change', (e) => {
    if (e.matches) reset();
  });
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

// A second listener rather than editing the site's existing one — both fire.
document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initEffect();
  initSlotVideo();
});
