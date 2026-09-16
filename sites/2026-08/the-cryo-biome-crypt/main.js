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
 * The band skews and changes speed in proportion to scroll velocity,
 * settling back to its base rate when scrolling stops.
 * ------------------------------------------------------------------ */
const MAX_SKEW = 7; // degrees
const MAX_BOOST = 2.4; // multiplier on the base animation rate

function initMarquee() {
  const track = document.querySelector('.cryo-marquee__track');
  if (!track) return;

  if (reduceMotion.matches) {
    track.style.animation = 'none';
    track.style.transform = 'none';
    return;
  }

  let lastY = window.scrollY;
  let velocity = 0;
  let frame = null;

  const settle = () => {
    frame = null;
    velocity *= 0.88;
    const magnitude = Math.min(1, Math.abs(velocity) / 55);
    const skew = -Math.sign(velocity) * magnitude * MAX_SKEW;
    const boost = 1 + magnitude * (MAX_BOOST - 1);
    track.style.setProperty('--marquee-skew', `${skew.toFixed(2)}deg`);
    track.style.animationDuration = `${(26 / boost).toFixed(2)}s`;

    if (Math.abs(velocity) > 0.4) {
      frame = requestAnimationFrame(settle);
    } else {
      track.style.setProperty('--marquee-skew', '0deg');
      track.style.animationDuration = '26s';
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
 * Video placement — hero background.
 * The still carries the hero until the generated loop is installed;
 * once a <video> is present it plays only while the hero is in view.
 * ------------------------------------------------------------------ */
function initHeroVideo() {
  const video = document.querySelector('.hero-video');
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
  initMarquee();
  initHeroVideo();
});
