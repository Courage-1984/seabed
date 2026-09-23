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
    oathBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startOath(); }, { passive: false });
    oathBtn.addEventListener('touchend', endOath);
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
    const openModal = () => {
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      if (video) video.play();
    };

    const closeModal = () => {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
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
    
    window.addEventListener('scroll', () => {
      requestAnimationFrame(handleScrollWipe);
    }, { passive: true });
    
    // Initial check
    handleScrollWipe();
  }
});
