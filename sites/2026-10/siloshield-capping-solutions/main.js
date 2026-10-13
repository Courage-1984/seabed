import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Navigation Toggle
  const navToggleBtn = document.getElementById('nav-toggle-btn');
  const primaryNav = document.getElementById('primary-nav');

  if (navToggleBtn && primaryNav) {
    navToggleBtn.addEventListener('click', () => {
      const isExpanded = navToggleBtn.getAttribute('aria-expanded') === 'true';
      navToggleBtn.setAttribute('aria-expanded', String(!isExpanded));
      primaryNav.classList.toggle('is-open', !isExpanded);
    });

    // Close menu when clicking navigation links
    const navLinks = primaryNav.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (primaryNav.classList.contains('is-open')) {
          navToggleBtn.setAttribute('aria-expanded', 'false');
          primaryNav.classList.remove('is-open');
        }
      });
    });

    // Dismiss with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && primaryNav.classList.contains('is-open')) {
        navToggleBtn.setAttribute('aria-expanded', 'false');
        primaryNav.classList.remove('is-open');
        navToggleBtn.focus();
      }
    });
  }

  // 2. Scroll-Reveal IntersectionObserver System (staggered, fires once, unobserves)
  const revealPlates = document.querySelectorAll('.reveal-plate');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.12,
      }
    );

    revealPlates.forEach((plate) => {
      revealObserver.observe(plate);
    });
  } else {
    // Fallback if IntersectionObserver is not supported
    revealPlates.forEach((plate) => plate.classList.add('is-revealed'));
  }

  // 3. Transition Band Video Intersection Observer (pause off-screen, play on-screen)
  const bandVideo = document.querySelector('.transition-band-video');
  if (bandVideo && 'IntersectionObserver' in window) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      const videoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const playPromise = bandVideo.play();
              if (playPromise !== undefined) {
                playPromise.catch(() => {
                  // Autoplay prevented or still waiting for stream
                });
              }
            } else {
              bandVideo.pause();
            }
          });
        },
        { threshold: 0.1 }
      );
      videoObserver.observe(bandVideo);
    }
  }

  // 4. Interactive Tidal Deployment Calculator
  const calcForm = document.getElementById('calculator-form');
  const diamInput = document.getElementById('calc-diameter');
  const constructInput = document.getElementById('calc-construction');
  const quayInput = document.getElementById('calc-quayside');
  const surgeInput = document.getElementById('calc-surge');

  const resKit = document.getElementById('res-kit');
  const resCrane = document.getElementById('res-crane');
  const resTime = document.getElementById('res-time');
  const resMargin = document.getElementById('res-margin');

  function updateCalculator() {
    if (!diamInput || !quayInput || !surgeInput) return;

    const diameter = parseFloat(diamInput.value) || 3.8;
    const quayDist = parseFloat(quayInput.value) || 8;
    const surgeHeight = parseFloat(surgeInput.value) || 3.5;
    const construct = constructInput ? constructInput.value : 'concrete';

    // Kit determination
    let kitText = 'SERIES A // SURGECAP MK-IV';
    let baseTime = 60;
    if (diameter > 4.5 && diameter <= 8.2) {
      kitText = 'SERIES B // HEAVY STORMWATER DROP CAISSON';
      baseTime = 95;
    } else if (diameter > 8.2) {
      kitText = 'SERIES C // MODULAR TRUSS BULKHEAD SYSTEM';
      baseTime = 140;
    } else if (construct === 'brick') {
      kitText = 'SERIES A // SURGECAP MK-IV (DEEP CELLULAR EPDM COLLAR)';
      baseTime = 75;
    }

    // Required Crane sizing
    let craneTonnage = 20;
    if (quayDist > 25 || diameter > 6.0) {
      craneTonnage = 60;
    } else if (quayDist > 15 || diameter > 4.5) {
      craneTonnage = 35;
    } else if (quayDist > 8) {
      craneTonnage = 25;
    }
    const craneText = `${craneTonnage}-TONNE BOOM (MIN ${Math.round(quayDist * 1.5 + 4)}m REACH)`;

    // Time estimate
    const totalMinutes = Math.round(baseTime + (quayDist > 12 ? 15 : 0));
    const timeText = `${totalMinutes} MINUTES (2 CERTIFIED RIGGERS)`;

    // Hydrostatic margin: SiloShield is certified to 4.2 bar (42.0m head of water)
    const safetyRatio = (42.0 / Math.max(surgeHeight, 1.0)).toFixed(1);
    const marginText = `${safetyRatio}x SURGE HEAD RESISTANCE (${(surgeHeight * 0.1).toFixed(2)} BAR vs 4.2 BAR MAX)`;

    if (resKit) resKit.textContent = kitText;
    if (resCrane) resCrane.textContent = craneText;
    if (resTime) resTime.textContent = timeText;
    if (resMargin) resMargin.textContent = marginText;
  }

  if (calcForm) {
    calcForm.addEventListener('submit', (e) => {
      e.preventDefault();
      updateCalculator();
    });

    [diamInput, constructInput, quayInput, surgeInput].forEach((input) => {
      if (input) {
        input.addEventListener('input', updateCalculator);
        input.addEventListener('change', updateCalculator);
      }
    });
  }

  // Initial calculation check
  updateCalculator();
});
