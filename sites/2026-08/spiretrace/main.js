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
 * Signature effect — drifting grain overlay.
 * A noise layer drifts slowly across the page at low opacity. It sits
 * beneath interactive content and is inert to the pointer.
 * ------------------------------------------------------------------ */
function initGrain() {
  if (reduceMotion.matches) return;
  const grain = document.createElement('div');
  grain.className = 'grain-overlay';
  grain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(grain);

  // Pause the drift whenever the tab is hidden so it costs nothing in
  // the background.
  const sync = () => grain.classList.toggle('is-paused', document.hidden);
  document.addEventListener('visibilitychange', sync);
  sync();
}

/* ------------------------------------------------------------------ *
 * Video placement — modal feature.
 * Keyboard-operable, focus-trapped, dismissible with Escape.
 * ------------------------------------------------------------------ */
function initVideoModal() {
  const modal = document.getElementById('pitch-film');
  const opener = document.querySelector('[data-video-open]');
  if (!modal || !opener) return;

  const player = modal.querySelector('.video-modal__player');
  const closeBtn = modal.querySelector('.video-modal__close');
  let lastFocused = null;

  const focusables = () =>
    [...modal.querySelectorAll('button, [href], video[controls]')].filter((el) => !el.hasAttribute('disabled'));

  const open = () => {
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('has-modal-open');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    closeBtn.focus();
    if (!reduceMotion.matches) player.play().catch(() => {});
  };

  const close = () => {
    modal.classList.remove('is-open');
    player.pause();
    document.body.classList.remove('has-modal-open');
    const finish = () => {
      modal.hidden = true;
      if (lastFocused) lastFocused.focus();
    };
    if (reduceMotion.matches) finish();
    else setTimeout(finish, 220);
  };

  opener.addEventListener('click', open);
  modal.querySelectorAll('[data-video-close]').forEach((el) => el.addEventListener('click', close));

  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initGrain();
  initVideoModal();
});
