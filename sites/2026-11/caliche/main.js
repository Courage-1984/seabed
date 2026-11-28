import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --------------------------------------------------------------------------
  // 1. Signature Effect: Numeric Counter Roll-Up on Intersection
  // --------------------------------------------------------------------------
  const counters = document.querySelectorAll('.counter[data-target]');
  
  if (prefersReducedMotion) {
    counters.forEach((counter) => {
      counter.textContent = counter.getAttribute('data-target');
    });
  } else {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const targetEl = entry.target;
            const targetVal = parseInt(targetEl.getAttribute('data-target'), 10);
            const duration = 1200; // ms
            const startTime = performance.now();

            function updateCounter(currentTime) {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // Ease-out cubic
              const ease = 1 - Math.pow(1 - progress, 3);
              const currentVal = Math.floor(ease * targetVal);
              
              if (targetVal >= 1000) {
                targetEl.textContent = currentVal.toLocaleString('en-GB');
              } else {
                targetEl.textContent = String(currentVal);
              }

              if (progress < 1) {
                requestAnimationFrame(updateCounter);
              } else {
                if (targetVal >= 1000) {
                  targetEl.textContent = targetVal.toLocaleString('en-GB');
                } else {
                  targetEl.textContent = String(targetVal);
                }
              }
            }

            requestAnimationFrame(updateCounter);
            observer.unobserve(targetEl);
          }
        });
      },
      { threshold: 0.2 }
    );

    counters.forEach((c) => counterObserver.observe(c));
  }

  // --------------------------------------------------------------------------
  // 2. IntersectionObserver Scroll Reveal System
  // --------------------------------------------------------------------------
  const revealElements = document.querySelectorAll('[data-reveal]');
  
  if (prefersReducedMotion) {
    revealElements.forEach((el) => el.classList.add('is-revealed'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach((el, idx) => {
      // Sibling stagger delay applied via style
      const delay = (idx % 4) * 60;
      el.style.transitionDelay = `${delay}ms`;
      revealObserver.observe(el);
    });
  }

  // --------------------------------------------------------------------------
  // 3. Modal Feature Video Overlay (Accessible, Focus-Trapped, Escape-Dismiss)
  // --------------------------------------------------------------------------
  const modal = document.getElementById('video-modal');
  const openBtn = document.getElementById('open-video-modal');
  const closeBtn = document.getElementById('close-video-modal');
  const doneBtn = document.getElementById('modal-done-btn');
  const videoPlayer = document.getElementById('modal-video-player');
  let lastFocusedElement = null;

  function openModal() {
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    // Focus close button inside modal
    if (closeBtn) closeBtn.focus();

    // Play video if available and motion is not reduced
    if (videoPlayer && !prefersReducedMotion) {
      videoPlayer.play().catch(() => {
        // Autoplay may be restricted; video remains ready with controls/poster
      });
    }
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';

    if (videoPlayer) {
      videoPlayer.pause();
    }

    // Restore focus to trigger
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    } else if (openBtn) {
      openBtn.focus();
    }
  }

  if (openBtn) {
    openBtn.addEventListener('click', openModal);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (doneBtn) {
    doneBtn.addEventListener('click', closeModal);
  }

  // Close on backdrop click (outside container)
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Keyboard support: Escape dismiss & focus trap
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 4. Accessible Reservation Form & Inline DOM Receipt
  // --------------------------------------------------------------------------
  const reservationForm = document.getElementById('tin-reservation-form');
  const receiptDisplay = document.getElementById('receipt-display');

  if (reservationForm) {
    reservationForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('painter-name');
      const emailInput = document.getElementById('painter-email');
      const regionInput = document.getElementById('base-region');
      const tierInput = document.getElementById('pass-tier');

      const nameError = document.getElementById('name-error');
      const emailError = document.getElementById('email-error');
      const regionError = document.getElementById('region-error');
      const tierError = document.getElementById('tier-error');

      // Clear previous error messages
      [nameError, emailError, regionError, tierError].forEach((el) => {
        if (el) el.textContent = '';
      });

      let isValid = true;

      if (!nameInput || !nameInput.value.trim()) {
        if (nameError) nameError.textContent = 'Please provide your painter name.';
        isValid = false;
      }

      if (!emailInput || !emailInput.value.trim() || !emailInput.value.includes('@')) {
        if (emailError) emailError.textContent = 'Please enter a valid dispatch email address.';
        isValid = false;
      }

      if (!regionInput || !regionInput.value) {
        if (regionError) regionError.textContent = 'Please select your primary field region.';
        isValid = false;
      }

      if (!tierInput || !tierInput.value) {
        if (tierError) tierError.textContent = 'Please select a membership pass tier.';
        isValid = false;
      }

      if (!isValid) return;

      // Populate inline confirmation receipt
      const receiptName = document.getElementById('receipt-name');
      const receiptRegion = document.getElementById('receipt-region');
      const receiptTier = document.getElementById('receipt-tier');
      const receiptMsg = document.getElementById('receipt-msg');
      const receiptCode = document.getElementById('receipt-code');

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const passCode = `PASS-2026-${randomSuffix}`;

      if (receiptName) receiptName.textContent = nameInput.value.trim();
      if (receiptRegion) receiptRegion.textContent = regionInput.options[regionInput.selectedIndex].text;
      if (receiptTier) receiptTier.textContent = tierInput.options[tierInput.selectedIndex].text;
      if (receiptCode) receiptCode.textContent = passCode;
      if (receiptMsg) {
        receiptMsg.textContent = `Dispatch notification sent to ${emailInput.value.trim()}. Your 24-pan spun-brass field tin will be packed on our Hay-on-Wye granite bench.`;
      }

      // Hide form fields & display receipt
      reservationForm.style.display = 'none';
      if (receiptDisplay) {
        receiptDisplay.removeAttribute('hidden');
        receiptDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
});
