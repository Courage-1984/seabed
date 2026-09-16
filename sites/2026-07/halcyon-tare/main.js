import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Scroll-reveal animation for diagonal bands and content sections
  const revealTargets = document.querySelectorAll('.motion-reveal');

  if ('IntersectionObserver' in window && revealTargets.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    revealTargets.forEach((target) => revealObserver.observe(target));
  } else {
    // Fallback for browsers or prefers-reduced-motion
    revealTargets.forEach((target) => target.classList.add('revealed'));
  }

  // 2. Interactive Tare Scale figure count up once (tare -> contents) on first viewport entry
  const scaleWidget = document.getElementById('tare-ledger-counter');

  if (scaleWidget && 'IntersectionObserver' in window) {
    let hasAnimateRan = false;

    const scaleObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimateRan) {
            hasAnimateRan = true;
            animateScaleNumbers();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    scaleObserver.observe(scaleWidget);
  }

  function animateScaleNumbers() {
    const tareEl = document.getElementById('tare-val');
    const grossEl = document.getElementById('gross-val');
    const netEl = document.getElementById('net-val');

    if (!tareEl || !grossEl || !netEl) return;

    const targetTare = 240; // g (HT-750 empty weight)
    const targetGross = 990; // g (gross scale weight)
    const targetNet = 750; // g (net contents)

    const duration = 2200; // ms
    const startTime = performance.now();

    function updateFrame(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function out-expo for crisp clinical mechanical feel
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const currentTare = Math.round(targetTare * ease);
      const currentGross = Math.round(targetGross * ease);
      const currentNet = Math.round(targetNet * ease);

      tareEl.textContent = `${String(currentTare).padStart(3, '0')}g`;
      grossEl.textContent = `${String(currentGross).padStart(4, '0')}g`;
      netEl.textContent = `${String(currentNet).padStart(3, '0')}g`;

      if (progress < 1) {
        requestAnimationFrame(updateFrame);
      }
    }

    requestAnimationFrame(updateFrame);
  }
});

/* ------------------------------------------------------------------ *
 * Video placement — section transition band.
 * The band wipes open as it rises through the viewport. The runway is
 * short so the wipe completes well before the band leaves the screen.
 * ------------------------------------------------------------------ */
function initTransitionBand() {
  const band = document.querySelector('[data-transition-band]');
  if (!band) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) {
    band.style.setProperty('--band-wipe', '100%');
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = band.getBoundingClientRect();
    const raw = (window.innerHeight - rect.top) / (window.innerHeight * 0.35);
    band.style.setProperty('--band-wipe', `${(Math.min(1, Math.max(0, raw)) * 100).toFixed(1)}%`);
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  // The loop only decodes while the band is on screen.
  const video = band.querySelector('[data-slot-video]');
  if (!video) return;
  const apply = () => {
    if (reduce.matches) {
      video.removeAttribute('autoplay');
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };
  reduce.addEventListener('change', apply);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reduce.matches) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.05 }
    ).observe(video);
  }
  apply();
}

document.addEventListener('DOMContentLoaded', initTransitionBand);
