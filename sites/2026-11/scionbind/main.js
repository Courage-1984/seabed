import './style.css';

/**
 * SCIONBIND — Pomological Germplasm & Cambial Grafting Systems
 * Scripting: Scroll-Reveal, Scroll-Velocity Marquee Skew, Video Optimization, Form Handler
 */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------------------------------
     1. Scroll-Reveal IntersectionObserver System
     -------------------------------------------------------------------------- */
  const revealElements = document.querySelectorAll('.specimen-reveal');
  const engravedRules = document.querySelectorAll('.engraved-rule');

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry, idx) => {
          if (entry.isIntersecting) {
            // Stagger reveal slightly for sibling elements
            setTimeout(() => {
              entry.target.classList.add('is-revealed');
            }, idx * 80);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));

    // Engraved Line Draw Observer
    const ruleObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-drawn');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    engravedRules.forEach((rule) => ruleObserver.observe(rule));
  } else {
    // Immediate fallback for no-JS or reduced motion
    revealElements.forEach((el) => el.classList.add('is-revealed'));
    engravedRules.forEach((rule) => rule.classList.add('is-drawn'));
  }

  /* --------------------------------------------------------------------------
     2. Signature Effect: Scroll-Velocity Marquee Skew
     Spec: A marquee or band skews and changes speed in proportion to scroll
     velocity, settling when scrolling stops.
     -------------------------------------------------------------------------- */
  const marqueeTrack = document.getElementById('skew-marquee-track');

  if (marqueeTrack && !prefersReducedMotion) {
    let lastScrollY = window.scrollY;
    let targetSkew = 0;
    let currentSkew = 0;
    let baseTranslate = 0;
    let scrollTimeout = null;

    // Duplicate ticker content to ensure seamless loop
    const clone = marqueeTrack.innerHTML;
    marqueeTrack.innerHTML = clone + clone;

    window.addEventListener(
      'scroll',
      () => {
        const currentY = window.scrollY;
        const deltaY = currentY - lastScrollY;
        lastScrollY = currentY;

        // Calculate skew angle based on scroll delta (clamped to -12deg..+12deg)
        const computedSkew = Math.max(-12, Math.min(12, deltaY * 0.28));
        targetSkew = computedSkew;

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          targetSkew = 0;
        }, 90);
      },
      { passive: true }
    );

    function animateMarquee() {
      // Linear interpolation (lerp) towards target skew
      currentSkew += (targetSkew - currentSkew) * 0.12;

      marqueeTrack.style.setProperty('--marquee-skew', `${currentSkew.toFixed(2)}deg`);

      if (marqueeTrack.getAnimations) {
        const speed = 1 + Math.min(3, Math.abs(currentSkew) * 0.25);
        marqueeTrack.getAnimations().forEach((anim) => {
          anim.playbackRate = speed;
        });
      }

      requestAnimationFrame(animateMarquee);
    }

    requestAnimationFrame(animateMarquee);
  }

  /* --------------------------------------------------------------------------
     3. Hero Video Background Lifecycle Management
     -------------------------------------------------------------------------- */
  const heroVideo = document.querySelector('.hero-video');

  if (heroVideo && !prefersReducedMotion) {
    heroVideo.addEventListener('playing', () => {
      heroVideo.classList.add('is-loaded');
    });

    if (heroVideo.readyState >= 2) {
      heroVideo.classList.add('is-loaded');
    }

    // Pause when out of viewport to save resources
    if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              heroVideo.play().catch(() => {});
            } else {
              heroVideo.pause();
            }
          });
        },
        { threshold: 0.1 }
      );
      videoObserver.observe(heroVideo);
    }
  }

  /* --------------------------------------------------------------------------
     4. Accession Reservation Form Handler
     -------------------------------------------------------------------------- */
  const orderForm = document.getElementById('accession-order-form');
  const feedbackEl = document.getElementById('form-feedback');

  if (orderForm && feedbackEl) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const affiliation = document.getElementById('org-affiliation')?.value || 'Estate';
      const accessionCodes = document.getElementById('accession-codes')?.value || 'Cultivars';

      feedbackEl.className = 'form-status-message is-success';
      feedbackEl.innerHTML = `
        <strong>ACCESS PROTOCOL RECORDED:</strong> Reservation requisition logged for <em>${affiliation}</em>.
        Requested accessions (<code>${accessionCodes}</code>) queued for mid-winter dormancy index verification.
        Formal phytosanitary plant passport schedule will be dispatched to your curator registry within 48 hours.
      `;

      orderForm.reset();
    });
  }
});
