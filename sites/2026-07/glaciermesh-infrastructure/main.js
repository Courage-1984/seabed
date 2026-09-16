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
 * Signature effect — animated SVG line-draw.
 * Each path measures itself, so dash values stay exact regardless of
 * viewBox scaling, then draws in on first intersection.
 * ------------------------------------------------------------------ */
function initEffect() {
  const svg = document.querySelector('[data-line-draw]');
  if (!svg) return;
  const paths = [...svg.querySelectorAll('.draw-path')];
  if (!paths.length) return;

  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    paths.forEach((path) => {
      path.style.strokeDasharray = 'none';
      path.style.strokeDashoffset = '0';
    });
    return;
  }
  paths.forEach((path, i) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    path.style.transitionDelay = `${i * 180}ms`;
  });
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      paths.forEach((path) => {
        path.style.strokeDashoffset = '0';
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(svg);
}

/* ------------------------------------------------------------------ *
 * Video placement — the loop only decodes while it is on screen.
 * Absent until the generated clip is installed, so this is a no-op
 * while the slot still shows its still frame.
 * ------------------------------------------------------------------ */
function initSlotVideo() {
  // Driven by its own interaction, not by viewport intersection.
  const video = document.querySelector('[data-slot-video]:not(.video-modal [data-slot-video])');
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

/* ------------------------------------------------------------------ *
 * Video placement — modal feature.
 * The poster tile opens a focus-trapped dialog: focus moves to the close
 * button, Tab cycles inside the frame, Escape closes, and focus returns
 * to the tile that opened it.
 * ------------------------------------------------------------------ */
function initVideoModal() {
  const opener = document.querySelector('[data-video-open]');
  const modal = document.getElementById('mesh-film');
  if (!opener || !modal) return;
  const frame = modal.querySelector('.video-modal__frame');
  let lastFocus = null;
  let closeTimer = null;
  const focusables = () =>
    [...frame.querySelectorAll('button, [href], video[controls]')].filter(
      (el) => !el.hasAttribute('disabled')
    );
  const open = () => {
    clearTimeout(closeTimer);
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('has-modal-open');
    // Next frame, so the transition has a from-state to animate out of.
    requestAnimationFrame(() => modal.classList.add('is-open'));
    const first = focusables()[0];
    if (first) first.focus();
    const video = modal.querySelector('[data-slot-video]');
    if (video && !reduceMotion.matches) video.play().catch(() => {});
  };
  const close = () => {
    modal.classList.remove('is-open');
    document.body.classList.remove('has-modal-open');
    const video = modal.querySelector('[data-slot-video]');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    const finish = () => {
      modal.hidden = true;
      if (lastFocus) lastFocus.focus();
    };
    if (reduceMotion.matches) finish();
    // Stored so a re-open inside the 220ms exit cancels it; otherwise the
    // stale timer hides the dialog again and leaves the scroll lock on.
    else closeTimer = setTimeout(finish, 220);
  };
  opener.addEventListener('click', open);
  modal.querySelectorAll('[data-video-close]').forEach((el) => {
    el.addEventListener('click', close);
  });
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
  initEffect();
  initSlotVideo();
  initVideoModal();
});
