import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================================
     1. Scroll-Reveal System (IntersectionObserver)
     ========================================================================= */
  const revealSections = document.querySelectorAll('.console-section');

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    revealSections.forEach((section) => {
      section.classList.add('reveal-init');
    });

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealSections.forEach((section) => revealObserver.observe(section));
  }

  /* =========================================================================
     2. Layout Family Signature Motion: Terminal / Data-Readout
     Data rows decode in sequence with a blinking cursor; numeric values settle.
     ========================================================================= */
  const matrixTable = document.querySelector('#sector-culvert-matrix');
  const dataRows = document.querySelectorAll('#matrix-tbody .data-row');

  if (matrixTable && dataRows.length > 0 && !prefersReducedMotion && 'IntersectionObserver' in window) {
    let hasDecoded = false;

    const matrixObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasDecoded) {
            hasDecoded = true;
            observer.unobserve(entry.target);

            dataRows.forEach((row, index) => {
              const numCells = row.querySelectorAll('.td-num');
              numCells.forEach((cell) => {
                const finalVal = cell.textContent.trim();
                cell.classList.add('decoding-text', 'decoding-cursor');
                cell.textContent = '---';

                setTimeout(() => {
                  let cycles = 0;
                  const interval = setInterval(() => {
                    cycles++;
                    if (cycles > 4) {
                      clearInterval(interval);
                      cell.textContent = finalVal;
                      cell.classList.remove('decoding-cursor');
                    } else {
                      cell.textContent = (Math.random() * 5).toFixed(2);
                    }
                  }, 40);
                }, index * 120);
              });
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    matrixObserver.observe(matrixTable);
  }

  /* =========================================================================
     3. Signature Effect: Scroll-Driven Clip-Path Wipe
     Section 5 emergency dewatering panel reveals via animated clip-path against scroll.
     ========================================================================= */
  const dewateringSection = document.getElementById('emergency-dewatering-spec');
  const wipePanel = document.getElementById('scroll-wipe-panel');

  if (dewateringSection && wipePanel && !prefersReducedMotion) {
    const updateClipWipe = () => {
      const rect = dewateringSection.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      // Calculate progress of section through the viewport
      // Starts wiping when top is at 85% of viewport, finishes when top reaches 25%
      const start = viewportHeight * 0.85;
      const end = viewportHeight * 0.25;

      let progress = (start - rect.top) / (start - end);
      progress = Math.max(0, Math.min(1, progress));

      // Angular diagonal polygon reveal: from top-right to bottom-left
      if (progress <= 0) {
        wipePanel.style.clipPath = 'polygon(0 0, 0 0, 0 100%, 0 100%)';
      } else if (progress >= 1) {
        wipePanel.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
      } else {
        const topEdge = Math.min(100, (progress * 130)).toFixed(1);
        const bottomEdge = Math.max(0, ((progress - 0.2) * 125)).toFixed(1);
        wipePanel.style.clipPath = `polygon(0 0, ${topEdge}% 0, ${bottomEdge}% 100%, 0 100%)`;
      }
    };

    window.addEventListener('scroll', updateClipWipe, { passive: true });
    window.addEventListener('resize', updateClipWipe, { passive: true });
    updateClipWipe();
  }

  /* =========================================================================
     4. Video Hover / Focus Interaction
     ========================================================================= */
  const videoTile = document.getElementById('video-grid-cell');
  const videoElement = videoTile ? videoTile.querySelector('.inspection-video-element') : null;

  if (videoTile && videoElement) {
    const playVideo = () => {
      if (videoElement.paused && !prefersReducedMotion) {
        videoElement.play().catch(() => {
          /* Autoplay policy fallback */
        });
      }
    };

    const pauseVideo = () => {
      if (!videoElement.paused) {
        videoElement.pause();
      }
    };

    videoTile.addEventListener('mouseenter', playVideo);
    videoTile.addEventListener('mouseleave', pauseVideo);
    videoTile.addEventListener('focusin', playVideo);
    videoTile.addEventListener('focusout', pauseVideo);
  }

  /* =========================================================================
     5. Technical Intake Form Submission Handler
     ========================================================================= */
  const intakeForm = document.getElementById('culvert-dispatch-form');
  const formStatus = document.getElementById('form-status');
  const submitBtn = document.getElementById('dispatch-submit-btn');

  if (intakeForm && formStatus) {
    intakeForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!intakeForm.checkValidity()) {
        intakeForm.reportValidity();
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Transmitting Telemetry...</span>';
      }

      setTimeout(() => {
        const refCode = `CT-${Math.floor(1000 + Math.random() * 9000)}-D${new Date().getFullYear()}`;
        formStatus.innerHTML = `<span style="color: var(--color-primary); font-weight: 700;">✓ OBSERVATION REGISTERED // INCIDENT REF: ${refCode} // DISPATCH NOTICE SENT TO DUTY SUPERINTENDENT</span>`;
        intakeForm.reset();

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Transmit Engineering Docket</span> <span class="btn-arrow" aria-hidden="true">&rarr;</span>';
        }
      }, 600);
    });
  }
});
