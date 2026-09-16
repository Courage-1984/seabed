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
  // The hover slot is driven by initHoverSlot, so it is excluded here:
  // otherwise it plays continuously behind its poster and the reveal
  // starts mid-clip instead of from the first frame.
  const video = document.querySelector('[data-slot-video]:not([data-slot-hover] [data-slot-video])');
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

/* ------------------------------------------------------------------ *
 * Video placement — hover reveal.
 * The opacity swap is CSS; this only starts and stops playback so the
 * clip does not decode while nobody is looking at it.
 * ------------------------------------------------------------------ */
function initHoverSlot() {
  const slot = document.querySelector('[data-slot-hover]');
  if (!slot) return;

  const play = () => {
    const video = slot.querySelector('[data-slot-video]');
    if (!video || reduceMotion.matches) return;
    finishing = false;
    video.loop = true;
    video.play().catch(() => {});
  };
  // Let the pass finish rather than cutting mid-frame: looping is dropped so
  // the clip can reach its natural end, then it resets and loops again on the
  // next hover. Re-entering before it ends simply restores the loop.
  let finishing = false;
  const stop = () => {
    const video = slot.querySelector('[data-slot-video]');
    if (!video || video.paused) return;
    finishing = true;
    video.loop = false;
    video.addEventListener(
      'ended',
      () => {
        if (!finishing) return;
        finishing = false;
        video.loop = true;
        video.pause();
        video.currentTime = 0;
      },
      { once: true }
    );
  };

  slot.addEventListener('pointerenter', play);
  slot.addEventListener('pointerleave', stop);
  slot.addEventListener('focusin', play);
  slot.addEventListener('focusout', stop);
}

document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initEffect();
  initSlotVideo();
  initHoverSlot();
});
