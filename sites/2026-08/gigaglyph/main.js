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
 * Signature effect — sticky section pinning with cross-fade.
 * The cast-sequence panel pins for the length of the section while its
 * four states cross-fade through in order.
 * ------------------------------------------------------------------ */
function initPinnedSequence() {
  const section = document.querySelector('[data-pin-section]');
  if (!section) return;
  const states = [...section.querySelectorAll('[data-pin-state]')];
  const stepLabel = section.querySelector('.pin-panel__step');
  if (states.length < 2) return;

  const setActive = (index) => {
    states.forEach((el, i) => el.classList.toggle('is-active', i === index));
    if (stepLabel) stepLabel.textContent = `STATE ${index + 1} / ${states.length}`;
  };

  if (reduceMotion.matches) {
    // Stack the states as plain sequential content rather than pinning.
    section.classList.add('is-unpinned');
    states.forEach((el) => el.classList.add('is-active'));
    return;
  }

  section.classList.add('is-pinned');

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = section.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    if (travel <= 0) {
      setActive(states.length - 1);
      return;
    }
    const progress = Math.min(1, Math.max(0, -rect.top / travel));
    setActive(Math.min(states.length - 1, Math.floor(progress * states.length)));
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
 * Video placement — inline process demo.
 * A demo player, so it never autoplays; it only stops decoding once it
 * leaves the viewport.
 * ------------------------------------------------------------------ */
function initProcessDemo() {
  const video = document.querySelector('.process-demo__video');
  if (!video || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting && !video.paused) video.pause();
    },
    { threshold: 0 }
  );
  observer.observe(video);
}

/* ------------------------------------------------------------------ *
 * Supporting motion — terminal readout details.
 * The cursor blink is driven by CSS and paused off-screen rather than
 * by a setInterval that runs for the life of the page.
 * ------------------------------------------------------------------ */
function initTerminalDetail() {
  const rows = document.querySelectorAll('.data-row');
  rows.forEach((row) => {
    row.addEventListener('pointerenter', () => row.classList.add('scan-active'));
    row.addEventListener('pointerleave', () => row.classList.remove('scan-active'));
    row.addEventListener('focusin', () => row.classList.add('scan-active'));
    row.addEventListener('focusout', () => row.classList.remove('scan-active'));
  });

  const cursors = document.querySelectorAll('.cursor-blink');
  if (!cursors.length || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('is-live', entry.isIntersecting));
  });
  cursors.forEach((c) => observer.observe(c));
}

document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initPinnedSequence();
  initProcessDemo();
  initTerminalDetail();
});
