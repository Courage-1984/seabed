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
 * Signature effect — sticky section pinning with cross-fade.
 * The loaf stack pins while its cards cross-fade through four states.
 * ------------------------------------------------------------------ */
function initStackPinning() {
  const section = document.querySelector('.loaf-stack-section');
  const stack = document.querySelector('.overlapping-card-stack');
  if (!section || !stack) return;

  const cards = [...stack.querySelectorAll('.loaf-card')];
  if (cards.length < 2) return;

  if (reduceMotion.matches) {
    section.classList.add('is-unpinned');
    cards.forEach((card) => card.classList.add('is-active'));
    return;
  }

  section.classList.add('is-pinned');

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = stack.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    if (travel <= 0) {
      cards.forEach((card) => card.classList.add('is-active'));
      return;
    }
    const progress = Math.min(1, Math.max(0, -rect.top / travel));
    const active = Math.min(cards.length - 1, Math.floor(progress * cards.length));

    cards.forEach((card, i) => {
      const distance = i - active;
      card.classList.toggle('is-active', distance === 0);
      card.style.setProperty('--stack-distance', String(distance));
    });
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
 * Video placement — modal feature.
 * Keyboard-operable, focus-trapped, dismissible with Escape.
 * ------------------------------------------------------------------ */
function initVideoModal() {
  const modal = document.getElementById('bake-film');
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

  // Never burn cycles decoding a loop nobody can see.
  if ('IntersectionObserver' in window) {
    const vis = new IntersectionObserver(
      ([entry]) => {
        if (modal.hidden) return;
        if (entry.isIntersecting && !reduceMotion.matches) player.play().catch(() => {});
        else player.pause();
      },
      { threshold: 0.1 }
    );
    vis.observe(modal);
  }
}

/* ------------------------------------------------------------------ *
 * Supporting motion — tide status pulse pauses when off-screen.
 * ------------------------------------------------------------------ */
function initStatusPulse() {
  const status = document.querySelector('.causeway-status');
  if (!status || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(([entry]) => status.classList.toggle('is-live', entry.isIntersecting), {
    threshold: 0,
  });
  observer.observe(status);
}

document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initStackPinning();
  initVideoModal();
  initStatusPulse();
});
