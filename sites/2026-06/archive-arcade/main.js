import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // FAQ Accordion Interactivity
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach((question) => {
    question.addEventListener('click', () => {
      const isExpanded = question.getAttribute('aria-expanded') === 'true';

      // Close all others
      faqQuestions.forEach((q) => q.setAttribute('aria-expanded', 'false'));

      // Toggle current
      if (!isExpanded) {
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });
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
 * Signature effect — scroll-driven clip-path wipe.
 * The panel is revealed by animating clip-path against scroll progress
 * rather than fading, so the content wipes into view.
 * ------------------------------------------------------------------ */
function initEffect() {
  const band = document.querySelector('[data-clip-wipe]');
  if (!band) return;
  if (reduceMotion.matches) {
    band.style.setProperty('--wipe', '100%');
    return;
  }
  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = band.getBoundingClientRect();
    // Short runway: if the band sits in a sticky element, its top stops
    // moving once that element pins, and a long runway freezes the wipe
    // partway through for the whole section.
    const raw = (window.innerHeight - rect.top) / (window.innerHeight * 0.35);
    band.style.setProperty('--wipe', `${(Math.min(1, Math.max(0, raw)) * 100).toFixed(1)}%`);
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
 * Video placement — the loop only decodes while it is on screen.
 * Absent until the generated clip is installed, so this is a no-op
 * while the slot still shows its still frame.
 * ------------------------------------------------------------------ */
function initSlotVideo() {
  // Driven by its own interaction, not by viewport intersection.
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

// A second listener rather than editing the site's existing one — both fire.
/* ------------------------------------------------------------------ *
 * Video placement — hover reveal.
 * The opacity swap is CSS; this drives playback and lets the pass
 * finish rather than cutting mid-frame when the pointer leaves.
 * ------------------------------------------------------------------ */
function initHoverSlot() {
  const slot = document.querySelector('[data-slot-hover]');
  if (!slot) return;
  let finishing = false;
  const play = () => {
    const video = slot.querySelector('[data-slot-video]');
    if (!video || reduceMotion.matches) return;
    finishing = false;
    video.loop = true;
    video.play().catch(() => {});
  };
  const stop = () => {
    const video = slot.querySelector('[data-slot-video]');
    if (!video || video.paused) return;
    finishing = true;
    video.loop = false;
    video.addEventListener('ended', () => {
      if (!finishing) return;
      finishing = false;
      video.loop = true;
      video.pause();
      video.currentTime = 0;
    }, { once: true });
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
