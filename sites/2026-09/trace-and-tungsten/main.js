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
 * Signature effect — scroll-velocity marquee skew.
 * The bands skew and change speed in proportion to scroll velocity,
 * settling back to their base rate when scrolling stops.
 * ------------------------------------------------------------------ */
const MAX_SKEW = 8; // degrees
const MAX_BOOST = 2.6; // multiplier on the base animation rate

function initMarqueeVelocity() {
  const tracks = [...document.querySelectorAll('.marquee-content')];
  if (!tracks.length) return;

  if (reduceMotion.matches) {
    tracks.forEach((t) => {
      t.style.animation = 'none';
      t.style.transform = 'none';
    });
    return;
  }

  let lastY = window.scrollY;
  let velocity = 0;
  let frame = null;

  const settle = () => {
    // Ease velocity back to rest so the bands relax instead of snapping.
    velocity *= 0.88;
    const magnitude = Math.min(1, Math.abs(velocity) / 55);
    const skew = -Math.sign(velocity) * magnitude * MAX_SKEW;
    const boost = 1 + magnitude * (MAX_BOOST - 1);

    for (const track of tracks) {
      track.style.setProperty('--marquee-skew', `${skew.toFixed(2)}deg`);
      track.style.animationDuration = `${(20 / boost).toFixed(2)}s`;
    }

    if (Math.abs(velocity) > 0.4) {
      frame = requestAnimationFrame(settle);
    } else {
      frame = null;
      for (const track of tracks) {
        track.style.setProperty('--marquee-skew', '0deg');
        track.style.animationDuration = '20s';
      }
    }
  };

  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      velocity = y - lastY;
      lastY = y;
      if (frame === null) frame = requestAnimationFrame(settle);
    },
    { passive: true }
  );
}

/* ------------------------------------------------------------------ *
 * Video placement — masked type fill.
 * The loop only decodes while the masked heading is on screen.
 * ------------------------------------------------------------------ */
function initMaskedTypeVideo() {
  const video = document.querySelector('.masked-type__video');
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
 * Supporting motion — telemetry pulse only runs while visible.
 * ------------------------------------------------------------------ */
function initTelemetryPulse() {
  const strip = document.querySelector('.telemetry-strip');
  if (!strip || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(([entry]) => strip.classList.toggle('is-live', entry.isIntersecting), {
    threshold: 0,
  });
  observer.observe(strip);
}

document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initMarqueeVelocity();
  initMaskedTypeVideo();
  initTelemetryPulse();
});
