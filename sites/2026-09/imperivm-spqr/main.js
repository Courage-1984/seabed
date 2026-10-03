import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Daily Sacramentum Oath Button
  const oathBtn = document.querySelector('.oath-btn');
  let holdTimeout;
  
  if (oathBtn) {
    const startOath = () => {
      oathBtn.classList.add('holding');
      // Simulated audio could be added here
      holdTimeout = setTimeout(() => {
        oathBtn.classList.remove('holding');
        oathBtn.classList.add('verified');
        oathBtn.textContent = 'CITIZEN IDENTIFIED. DAILY GRAIN & BANDWIDTH ISSUED.';
        oathBtn.disabled = true;
      }, 3000);
    };

    const endOath = () => {
      if (!oathBtn.disabled) {
        clearTimeout(holdTimeout);
        oathBtn.classList.remove('holding');
      }
    };

    oathBtn.addEventListener('mousedown', startOath);
    oathBtn.addEventListener('mouseup', endOath);
    oathBtn.addEventListener('mouseleave', endOath);
    // preventDefault() on touchstart cancelled any scroll that began on the
    // button, and the button is full-width in the hero on a phone -- swiping
    // up from it did nothing. user-select/touch-callout are handled in CSS
    // instead, so the gesture stays live.
    oathBtn.addEventListener('touchstart', startOath, { passive: true });
    oathBtn.addEventListener('touchend', endOath);
    // Touch cancellation is routine on a phone (system back gesture, incoming
    // notification, palm rejection). Without this the button stays stuck in
    // .holding with the shake animation running forever.
    oathBtn.addEventListener('touchcancel', endOath);
  }

  // 2. Motion Budget - IntersectionObserver for reveal
  const reveals = document.querySelectorAll('[data-reveal]');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Only trigger once
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(el => revealObserver.observe(el));

  // 3. Modal Feature for Video
  const modalTrigger = document.querySelector('.modal-feature-trigger');
  const modal = document.getElementById('video-modal');
  const modalClose = document.querySelector('.modal-close');
  const video = modal ? modal.querySelector('video') : null;

  if (modalTrigger && modal) {
    // The modal-feature slot's spec requires the overlay to be keyboard
    // operable, focus-trapped and Escape-dismissible. Escape was handled;
    // focus was not, so Tab walked straight out of the open dialog and kept
    // going through the page behind it.
    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let lastFocused = null;

    const trapFocus = (e) => {
      if (e.key !== 'Tab') return;
      const items = [...modal.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const openModal = () => {
      lastFocused = document.activeElement;
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      document.addEventListener('keydown', trapFocus);
      // Without a scroll lock the page scrolls behind the overlay on touch.
      document.body.style.overflow = 'hidden';
      if (modalClose) modalClose.focus();
      if (video) video.play();
    };

    const closeModal = () => {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', trapFocus);
      document.body.style.overflow = '';
      // Returning focus to the trigger is what makes the dialog usable
      // without a mouse; otherwise focus resets to the top of the document.
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    };

    modalTrigger.addEventListener('click', openModal);
    modalTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal();
      }
    });

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
      }
    });
  }

  // 4. Sedition Form feedback
  const form = document.getElementById('sedition-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.style.display = 'none';
      document.querySelector('.form-feedback').classList.remove('hidden');
    });
  }

  // 5. Signature Effect: scroll-driven clip-path wipe for section-censor
  const wipeSection = document.querySelector('[data-reveal="wipe"]');
  if (wipeSection) {
    const handleScrollWipe = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = wipeSection.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate progress when element is entering the viewport
      if (rect.top < viewportHeight && rect.bottom > 0) {
        // Percentage of element visible
        let progress = 1 - (rect.top / viewportHeight);
        progress = Math.max(0, Math.min(1, progress * 1.5)); // Accelerate effect
        
        const insetTop = 100 - (progress * 100);
        wipeSection.style.clipPath = `inset(${insetTop}% 0 0 0)`;
      }
    };
    
    // One rAF callback was queued per scroll event, each forcing a sync
    // layout read and then writing clip-path on a full section -- read/write
    // thrash that janks the whole censor section on a mid-range phone.
    let wipeQueued = false;
    window.addEventListener(
      'scroll',
      () => {
        if (wipeQueued) return;
        wipeQueued = true;
        requestAnimationFrame(() => {
          wipeQueued = false;
          handleScrollWipe();
        });
      },
      { passive: true }
    );
    
    // Initial check
    handleScrollWipe();
  }
});
