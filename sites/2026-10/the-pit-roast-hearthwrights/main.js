import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // 1. IntersectionObserver Scroll-Reveal System (Staggered, fires once, never re-triggers)
  const revealElements = document.querySelectorAll('.reveal-plate');
  if ('IntersectionObserver' in window) {
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
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback for browsers without IntersectionObserver
    revealElements.forEach((el) => el.classList.add('revealed'));
  }

  // 2. Signature Effect: Masked Scroll-Through Type Parallax Tuning
  const maskedHeadlines = document.querySelectorAll('.masked-type-headline');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (maskedHeadlines.length > 0 && !prefersReducedMotion) {
    window.addEventListener(
      'scroll',
      () => {
        const scrollY = window.scrollY;
        maskedHeadlines.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            const offset = (scrollY - el.offsetTop) * 0.15;
            el.style.backgroundPositionY = `${offset}px`;
          }
        });
      },
      { passive: true }
    );
  }

  // 3. Ambient Video Loop Management (Muted, paused when off-screen)
  const ambientVideos = document.querySelectorAll('video.footer-ambient-video');
  if (ambientVideos.length > 0 && 'IntersectionObserver' in window && !prefersReducedMotion) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {
                // Autoplay may be restricted by browser until interaction
              });
            }
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.05 }
    );

    ambientVideos.forEach((v) => videoObserver.observe(v));
  }

  // 4. Commissioning Form Interactive Submission
  const bookingForm = document.getElementById('hearth-commissioning-form');
  const statusEl = document.getElementById('form-status-msg');

  if (bookingForm && statusEl) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = bookingForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'TRANSMITTING SPECIFICATION...';
      }

      setTimeout(() => {
        statusEl.className = 'form-status success';
        statusEl.textContent = 'Foundry allocation brief recorded. Kingston Basin engineering desk will contact you within 24 hours with geotechnical survey parameters.';
        statusEl.setAttribute('role', 'status');
        bookingForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'SUBMIT HEARTH COMMISSIONING SPEC';
        }
      }, 700);
    });
  }
});
