import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Scroll-Reveal System (Staggered by 75ms, fires once, unobserves)
  const cards = document.querySelectorAll('.blueprint-card');
  if (cards.length > 0) {
    if (isReducedMotion) {
      cards.forEach((c) => c.classList.add('is-revealed'));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry, idx) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                entry.target.classList.add('is-revealed');
              }, idx * 75);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );

      cards.forEach((card) => revealObserver.observe(card));
    }
  }

  // 2. Sticky-Rail Active Step & Telemetry Tracker (Section 3)
  const stepPills = document.querySelectorAll('.tracker-step-pill');
  const phaseCards = [
    document.getElementById('phase-1'),
    document.getElementById('phase-2'),
    document.getElementById('phase-3'),
  ].filter(Boolean);

  const uvElem = document.getElementById('telemetry-uv');
  const windElem = document.getElementById('telemetry-wind');
  const moistureElem = document.getElementById('telemetry-moisture');

  const telemetryData = {
    1: { uv: 'UV 0.2', wind: '8.4 KTS', moisture: '68.5%' },
    2: { uv: 'UV 5.8', wind: '16.8 KTS', moisture: '14.2%' },
    3: { uv: 'UV 4.9', wind: '19.2 KTS', moisture: '94.0%' },
  };

  if (phaseCards.length > 0 && stepPills.length > 0) {
    const railObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepNum = entry.target.getAttribute('data-step');
            stepPills.forEach((pill) => {
              if (pill.getAttribute('data-target') === entry.target.id) {
                pill.classList.add('is-active');
              } else {
                pill.classList.remove('is-active');
              }
            });

            if (telemetryData[stepNum]) {
              if (uvElem) uvElem.textContent = telemetryData[stepNum].uv;
              if (windElem) windElem.textContent = telemetryData[stepNum].wind;
              if (moistureElem) moistureElem.textContent = telemetryData[stepNum].moisture;
            }
          }
        });
      },
      { threshold: 0.45, rootMargin: '-10% 0px -40% 0px' }
    );

    phaseCards.forEach((card) => railObserver.observe(card));

    // Keyboard & click navigation on pills
    stepPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const targetId = pill.getAttribute('data-target');
        const targetCard = document.getElementById(targetId);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: isReducedMotion ? 'auto' : 'smooth', block: 'center' });
        }
      });
    });
  }

  // 3. Numeric Counter Roll-Up (Section 5)
  const counterElements = document.querySelectorAll('.counter-val');
  if (counterElements.length > 0) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const targetVal = parseInt(el.getAttribute('data-target'), 10);
            if (!isNaN(targetVal)) {
              if (isReducedMotion) {
                el.textContent = targetVal.toLocaleString('en-GB');
              } else {
                animateCounter(el, targetVal, 1200);
              }
            }
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.2 }
    );

    counterElements.forEach((el) => counterObserver.observe(el));
  }

  function animateCounter(element, target, duration) {
    const startTime = performance.now();
    const startVal = 0;

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.floor(startVal + (target - startVal) * easeProgress);

      element.textContent = currentVal.toLocaleString('en-GB');

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = target.toLocaleString('en-GB');
      }
    }

    requestAnimationFrame(step);
  }

  // 4. Video Viewport Observer (Section 3 Sticky Rail)
  const scaffoldingVideo = document.getElementById('scaffolding-video');
  if (scaffoldingVideo) {
    if (isReducedMotion) {
      scaffoldingVideo.pause();
    } else {
      const videoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              scaffoldingVideo.play().catch(() => {});
            } else {
              scaffoldingVideo.pause();
            }
          });
        },
        { threshold: 0.1 }
      );

      videoObserver.observe(scaffoldingVideo);
    }
  }

  // 5. Accessible Protocol Modal Dialog
  const openModalBtn = document.getElementById('protocol-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const protocolModal = document.getElementById('protocol-modal');

  if (openModalBtn && closeModalBtn && protocolModal) {
    openModalBtn.addEventListener('click', () => {
      protocolModal.showModal();
      closeModalBtn.focus();
    });

    closeModalBtn.addEventListener('click', () => {
      protocolModal.close();
      openModalBtn.focus();
    });

    protocolModal.addEventListener('click', (e) => {
      const rect = protocolModal.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        protocolModal.close();
        openModalBtn.focus();
      }
    });

    protocolModal.addEventListener('close', () => {
      openModalBtn.focus();
    });
  }

  // 6. Emergency Intake Form Submission
  const surveyForm = document.getElementById('survey-form');
  if (surveyForm) {
    surveyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const structureName = document.getElementById('structure-name')?.value || 'Condemned Structure';
      const refId = 'CC-DEMO-' + Math.floor(1000 + Math.random() * 9000);
      alert(
        `[DISPATCH ACKNOWLEDGED]\nSurvey Ticket: ${refId}\nFacility: ${structureName}\nField team mobilized from Arch 42. Radio crew monitoring 433.850 MHz.`
      );
      surveyForm.reset();
    });
  }

  // 7. Mobile Navigation Menu
  const navToggleBtn = document.getElementById('nav-toggle-btn');
  const navMenuList = document.getElementById('nav-menu-list');
  if (navToggleBtn && navMenuList) {
    navToggleBtn.addEventListener('click', () => {
      const isExpanded = navToggleBtn.getAttribute('aria-expanded') === 'true';
      navToggleBtn.setAttribute('aria-expanded', String(!isExpanded));
      navMenuList.classList.toggle('is-open');
    });

    navMenuList.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        navToggleBtn.setAttribute('aria-expanded', 'false');
        navMenuList.classList.remove('is-open');
      });
    });
  }
});
