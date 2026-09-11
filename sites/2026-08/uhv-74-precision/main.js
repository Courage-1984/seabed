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
 * Signature effect — masked scroll-through type.
 * Oversized type acts as a window onto imagery that scrolls at a
 * different rate than the page, so the fill drifts through the glyphs.
 * ------------------------------------------------------------------ */
function initMaskedType() {
  const band = document.querySelector('[data-masked-type]');
  if (!band) return;

  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    band.style.setProperty('--mask-shift', '0px');
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = band.getBoundingClientRect();
    const total = rect.height + window.innerHeight;
    // -1 .. 1 across the band's full travel through the viewport.
    const progress = (window.innerHeight - rect.top) / total;
    band.style.setProperty('--mask-shift', `${(progress - 0.5) * -220}px`);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener('scroll', onScroll, { passive: true });
        update();
      } else {
        window.removeEventListener('scroll', onScroll);
      }
    },
    { threshold: 0 }
  );
  io.observe(band);
}

/* ------------------------------------------------------------------ *
 * Video placement — hover reveal.
 * The poster is the resting state. The loop plays on hover and on
 * :focus-visible, and never decodes otherwise. Touch devices, which
 * have no real hover, simply keep the poster.
 * ------------------------------------------------------------------ */
function initHoverReveal() {
  const container = document.querySelector('[data-hover-reveal]');
  if (!container) return;
  const video = container.querySelector('.hover-reveal-video');
  if (!video) return;

  const canPlay = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion.matches;

  const show = () => {
    if (!canPlay()) return;
    container.classList.add('is-revealing');
    video.play().catch(() => {});
  };
  const hide = () => {
    container.classList.remove('is-revealing');
    video.pause();
    video.currentTime = 0;
  };

  container.addEventListener('pointerenter', show);
  container.addEventListener('pointerleave', hide);
  // Keyboard parity: focus reveals, blur restores the poster.
  container.addEventListener('focus', show);
  container.addEventListener('blur', hide);

  // Never leave it decoding once it scrolls away.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) hide();
    });
    io.observe(container);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initMaskedType();
  initHoverReveal();
});
