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
 * Signature effect — numeric counter roll-up.
 * Real figures count from zero on first intersection, once. The final
 * value is already in the markup, so it is correct with no JS.
 * ------------------------------------------------------------------ */
const COUNT_DURATION = 1100;

function rollUp(el) {
  const target = Number(el.dataset.countTo);
  const decimals = Number(el.dataset.decimals ?? 0);
  if (!Number.isFinite(target)) return;
  const start = performance.now();
  const format = (n) => n.toFixed(decimals);
  const tick = (now) => {
    // The rAF timestamp is the frame's start time and can predate the reading
    // above; without the lower clamp easeOutCubic renders negative figures.
    const t = Math.min(1, Math.max(0, (now - start) / COUNT_DURATION));
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = format(target * eased);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = format(target);
  };
  requestAnimationFrame(tick);
}

function initEffect() {
  const values = document.querySelectorAll('[data-count-to]');
  if (!values.length) return;
  if (reduceMotion.matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        rollUp(entry.target);
      });
    },
    { threshold: 0.6 }
  );
  values.forEach((el) => observer.observe(el));
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
    video.play().catch(() => {});
  };
  const stop = () => {
    const video = slot.querySelector('[data-slot-video]');
    if (!video) return;
    video.pause();
    video.currentTime = 0;
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
