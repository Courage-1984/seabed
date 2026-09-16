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
  // anchor jump or a programmatic scroll.
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
 * Signature effect — progressive blur focus-pull.
 * Elements resolve from blurred to sharp as they rise through the
 * viewport, driven by scroll position rather than a one-shot trigger.
 * ------------------------------------------------------------------ */
function initFocusPull() {
  const targets = [...document.querySelectorAll('[data-focus-pull]')];
  if (!targets.length) return;

  if (reduceMotion.matches) {
    targets.forEach((el) => {
      el.style.setProperty('--focus-blur', '0px');
      el.style.setProperty('--focus-fade', '1');
    });
    return;
  }

  let ticking = false;

  // Every target is measured on each frame rather than tracked through an
  // IntersectionObserver set: the observer only fires on a change of state, so
  // an element that never reported a transition would keep its initial blur
  // forever. A bounded rect read per target is cheap and cannot get stuck.
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) continue; // far off-screen
      // 0 while still low in the viewport, 1 once it has risen past 55%.
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.55)));
      el.style.setProperty('--focus-blur', `${((1 - progress) * 10).toFixed(2)}px`);
      el.style.setProperty('--focus-fade', String(0.4 + progress * 0.6));
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ------------------------------------------------------------------ *
 * Video placement — footer ambient.
 * Heavily scrimmed backdrop behind the closing footer; it only decodes
 * while the footer is actually on screen.
 * ------------------------------------------------------------------ */
function initFooterAmbient() {
  const video = document.querySelector('.footer-ambient');
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
  initFocusPull();
  initFooterAmbient();
});
