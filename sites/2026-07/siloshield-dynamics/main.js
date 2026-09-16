import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });

  // Form handling
  const dispatchForm = document.getElementById('dispatch-form');
  const statusMessage = document.getElementById('form-status');

  if (dispatchForm) {
    dispatchForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const btn = dispatchForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;

      // Simulate encrypted connection & processing
      btn.textContent = 'Encrypting Transmission...';
      btn.disabled = true;

      setTimeout(() => {
        statusMessage.style.color = 'var(--color-accent)';
        statusMessage.textContent = 'Transmission Secure. Drone Dispatch Initiated. Await further telemetry.';

        btn.textContent = originalText;
        btn.disabled = false;
        dispatchForm.reset();

        // Clear message after 5 seconds
        setTimeout(() => {
          statusMessage.textContent = '';
        }, 5000);
      }, 1500);
    });
  }

  // The pre-v2.1 micro-animation observer lived here. It set inline
  // opacity/transform on every `.bento-item` — the same elements that now carry
  // `data-reveal` — and inline styles outrank the stylesheet, so the two reveal
  // systems fought and the legacy one had no prefers-reduced-motion guard.
  // Removed in favour of the contract v2.1 system below; nothing else used it.
});

/* ================================================================== *
 * Contract v2.1 motion system.
 * Appended rather than replacing this file: the site's own behaviour
 * above (contact form, status messaging) is still live. Its legacy reveal
 * observer was removed, because it wrote inline opacity/transform onto the
 * same `.bento-item` elements that carry `data-reveal`. `initReveals()`
 * still strips those properties defensively; see the note there.
 * ================================================================== */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ------------------------------------------------------------------ *
 * Motion budget 1 — staggered scroll-reveal system.
 * Fires once per element, never re-triggers.
 * ------------------------------------------------------------------ */
function initReveals() {
  const targets = [...document.querySelectorAll('[data-reveal]')];
  if (!targets.length) return;

  // Hand the targets back to the stylesheet first. Inline declarations outrank
  // both `.js-reveal [data-reveal].is-revealed` and the reduced-motion reset, so
  // anything that sets them would stop the reveal animating and strand
  // reduced-motion users at opacity 0. The site's legacy observer used to do
  // exactly that; it is gone, and this keeps the invariant regardless.
  for (const el of targets) {
    el.style.removeProperty('opacity');
    el.style.removeProperty('transform');
    el.style.removeProperty('transition');
  }

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
 * Signature effect — magnetic proximity cursor element.
 * Targets lean towards the pointer once it is inside their pull radius
 * and spring back when it leaves. Pointer-driven, so it is skipped
 * entirely on touch, where there is no cursor to be attracted to.
 * ------------------------------------------------------------------ */
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

function initEffect() {
  const targets = [...document.querySelectorAll('[data-magnetic]')];
  if (!targets.length) return;

  const RADIUS = 120; // px beyond the element's box that still pulls
  const PULL = 0.28; // fraction of the offset the element travels

  const reset = () => {
    targets.forEach((el) => {
      el.style.setProperty('--magnet-x', '0px');
      el.style.setProperty('--magnet-y', '0px');
    });
  };

  if (reduceMotion.matches || !finePointer.matches) {
    reset();
    return;
  }

  let pointer = null;
  let ticking = false;

  const update = () => {
    ticking = false;
    if (!pointer) return;
    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) continue;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = pointer.x - cx;
      const dy = pointer.y - cy;
      // Distance to the box, not to its centre, so wide elements behave.
      const gapX = Math.max(0, Math.abs(dx) - rect.width / 2);
      const gapY = Math.max(0, Math.abs(dy) - rect.height / 2);
      const gap = Math.hypot(gapX, gapY);
      if (gap > RADIUS) {
        el.style.setProperty('--magnet-x', '0px');
        el.style.setProperty('--magnet-y', '0px');
        continue;
      }
      const strength = (1 - gap / RADIUS) * PULL;
      el.style.setProperty('--magnet-x', `${(dx * strength).toFixed(2)}px`);
      el.style.setProperty('--magnet-y', `${(dy * strength).toFixed(2)}px`);
    }
  };

  const onMove = (event) => {
    pointer = { x: event.clientX, y: event.clientY };
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('scroll', onMove.bind(null, { clientX: -9999, clientY: -9999 }), {
    passive: true,
  });
  window.addEventListener('blur', reset);
  finePointer.addEventListener('change', (e) => {
    if (!e.matches) reset();
  });
  reduceMotion.addEventListener('change', (e) => {
    if (e.matches) reset();
  });
}

/* ------------------------------------------------------------------ *
 * Video placement — the loop only decodes while it is on screen.
 * Absent until the generated clip is installed, so this is a no-op
 * while the slot still shows its still frame.
 * ------------------------------------------------------------------ */
function initSlotVideo() {
  const video = document.querySelector('[data-slot-video]');
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
document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initEffect();
  initSlotVideo();
});
