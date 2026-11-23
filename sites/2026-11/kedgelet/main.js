import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --------------------------------------------------------------------------
  // Mobile Navigation Drawer
  // --------------------------------------------------------------------------
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', String(!isExpanded));
      mobileNav.classList.toggle('open', !isExpanded);
    });

    // Close on link click
    mobileNav.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('open');
      });
    });
  }

  // --------------------------------------------------------------------------
  // IntersectionObserver Scroll Reveal System
  // --------------------------------------------------------------------------
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  if (revealElements.length > 0) {
    if (isReducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach((el) => el.classList.add('revealed'));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -40px 0px', threshold: 0.15 }
      );

      revealElements.forEach((el) => revealObserver.observe(el));
    }
  }

  // --------------------------------------------------------------------------
  // Signature Effect: Masked Scroll-Through Type
  // --------------------------------------------------------------------------
  const maskedHeadline = document.querySelector('.masked-scroll-headline');
  if (maskedHeadline && !isReducedMotion) {
    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const rect = maskedHeadline.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            if (rect.top < viewportHeight && rect.bottom > 0) {
              const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
              const posX = Math.round(progress * 100);
              maskedHeadline.style.backgroundPosition = `${posX}% 50%`;
            }
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  // --------------------------------------------------------------------------
  // Dispatch Order Form Handler (dispatch.html)
  // --------------------------------------------------------------------------
  const dispatchForm = document.getElementById('pilot-dispatch-form');
  const receiptCard = document.getElementById('dispatch-receipt');

  if (dispatchForm && receiptCard) {
    dispatchForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const kitSelect = document.getElementById('field-kit');
      const scaleSelect = document.getElementById('field-scale');
      const vesselInput = document.getElementById('field-vessel');
      const emailInput = document.getElementById('field-email');
      const notesInput = document.getElementById('field-notes');

      const receiptRef = document.getElementById('receipt-ref');
      const receiptKit = document.getElementById('receipt-kit');
      const receiptScale = document.getElementById('receipt-scale');
      const receiptStamp = document.getElementById('receipt-stamp');

      const randomBatch = Math.floor(Math.random() * 89) + 47;
      const refCode = `FAL-B${randomBatch}-${Math.floor(1000 + Math.random() * 9000)}`;

      if (receiptRef) receiptRef.textContent = refCode;
      if (receiptKit && kitSelect) receiptKit.textContent = kitSelect.options[kitSelect.selectedIndex].text;
      if (receiptScale && scaleSelect) receiptScale.textContent = scaleSelect.value;
      if (receiptStamp && vesselInput) {
        receiptStamp.textContent = vesselInput.value.trim() ? vesselInput.value.trim() : 'Standard Admiralty Crest';
      }

      dispatchForm.style.display = 'none';
      receiptCard.classList.add('show');
      receiptCard.scrollIntoView({ behavior: isReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
    });

    const resetBtn = document.getElementById('btn-order-another');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        dispatchForm.reset();
        dispatchForm.style.display = 'block';
        receiptCard.classList.remove('show');
      });
    }
  }
});
