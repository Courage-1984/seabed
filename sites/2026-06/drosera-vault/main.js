import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Live Countdown Logic
  const countdownElements = document.querySelectorAll('[data-countdown]');

  countdownElements.forEach((el) => {
    let secondsLeft = parseInt(el.getAttribute('data-countdown'), 10);

    const updateTimer = () => {
      if (secondsLeft <= 0) {
        el.textContent = '00:00:00';
        return;
      }

      const h = Math.floor(secondsLeft / 3600)
        .toString()
        .padStart(2, '0');
      const m = Math.floor((secondsLeft % 3600) / 60)
        .toString()
        .padStart(2, '0');
      const s = (secondsLeft % 60).toString().padStart(2, '0');

      el.textContent = `${h}:${m}:${s}`;
      secondsLeft--;
    };

    updateTimer();
    setInterval(updateTimer, 1000);
  });
});

/* ================================================================== *
 * Contract v2.1 motion system.
 * Appended rather than replacing this file: the site's own behaviour
 * above is still live. The reveal system keys off `data-reveal` and
 * `is-revealed`, so it does not collide with any existing observer.
 * ================================================================== */
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
 * Signature effect — CSS 3D card tilt.
 * Cards tilt toward the pointer with perspective and a moving specular
 * highlight. Pointer-fine only; touch and reduced motion opt out.
 * ------------------------------------------------------------------ */
const MAX_TILT = 7; // degrees

function initEffect() {
  const tiles = [...document.querySelectorAll('[data-tilt]')];
  if (!tiles.length) return;

  const enabled = () => finePointer.matches && !reduceMotion.matches;
  const reset = (tile) => {
    tile.style.removeProperty('--tilt-x');
    tile.style.removeProperty('--tilt-y');
    tile.style.removeProperty('--glare-x');
    tile.style.removeProperty('--glare-y');
    tile.classList.remove('is-tilting');
  };
  if (!enabled()) tiles.forEach(reset);

  for (const tile of tiles) {
    let frame = null;
    let pending = null;
    const apply = () => {
      frame = null;
      if (!pending) return;
      const { rect, x, y } = pending;
      const px = (x - rect.left) / rect.width;
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
    tile.addEventListener('focusin', () => tile.classList.add('is-tilting'));
    tile.addEventListener('focusout', () => reset(tile));
  }

  const onChange = () => tiles.forEach(reset);
  reduceMotion.addEventListener('change', onChange);
  finePointer.addEventListener('change', onChange);
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
