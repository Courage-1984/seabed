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
    el.style.setProperty('--reveal-delay', `${step * 85}ms`);
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
 * Signature effect — numeric counter roll-up.
 * Real figures count from zero on first intersection, once. The final
 * text is already in the markup, so the value is correct with no JS.
 * ------------------------------------------------------------------ */
const COUNT_DURATION = 1100;

function rollUp(el) {
  const target = Number(el.dataset.countTo);
  const decimals = Number(el.dataset.decimals ?? 0);
  if (!Number.isFinite(target)) return;

  const start = performance.now();
  const format = (n) => n.toFixed(decimals);

  const tick = (now) => {
    // The rAF timestamp is the frame's start time, which can predate the
    // performance.now() reading above. Without the lower clamp that yields a
    // negative t, and easeOutCubic then renders negative figures on screen.
    const t = Math.min(1, Math.max(0, (now - start) / COUNT_DURATION));
    // easeOutCubic: fast start, gentle settle.
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = format(target * eased);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = format(target);
  };
  requestAnimationFrame(tick);
}

function initCounters() {
  const values = document.querySelectorAll('[data-count-to]');
  if (!values.length) return;
  if (reduceMotion.matches || !('IntersectionObserver' in window)) return; // markup already holds the final value

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
 * Video placement — hero inset frame.
 * Pause the loop whenever the framed panel is off-screen.
 * ------------------------------------------------------------------ */
function initInsetVideo() {
  const video = document.querySelector('.hero-inset__video');
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
 * Supporting motion — card stack lifts the entry nearest the viewport
 * centre, reinforcing the overlapping card-stack family.
 * ------------------------------------------------------------------ */
function initCardStack() {
  const cards = [...document.querySelectorAll('.log-entry, .stack-card')];
  if (!cards.length || reduceMotion.matches || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-current', e.isIntersecting)),
    { rootMargin: '-42% 0px -42% 0px' }
  );
  cards.forEach((c) => observer.observe(c));
}

document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initCounters();
  initInsetVideo();
  initCardStack();
});
