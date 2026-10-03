import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // 1. Scroll-Reveal System
  const revealObserver = new IntersectionObserver((entries) => {
    let delay = 0;
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (prefersReducedMotion.matches) {
          entry.target.classList.add('is-active');
        } else {
          setTimeout(() => {
            entry.target.classList.add('is-active');
          }, delay);
          delay += 80;
        }
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

  document.querySelectorAll('.reveal-block').forEach((el) => {
    revealObserver.observe(el);
  });

  // 2. Signature Motion: Card Destacking
  const stackCards = document.querySelectorAll('.stack-card');
  const stackObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !prefersReducedMotion.matches) {
        entry.target.classList.add('is-destacked');
      } else {
        entry.target.classList.remove('is-destacked');
      }
    });
  }, { rootMargin: '-30% 0px -30% 0px', threshold: 0 });

  stackCards.forEach((card) => {
    stackObserver.observe(card);
  });

  // 3. Counter Animation
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const duration = 2000;
    const start = performance.now();
    
    const step = (timestamp) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      // ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeProgress * target);
      el.textContent = current;
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    };
    
    requestAnimationFrame(step);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (prefersReducedMotion.matches) {
          entry.target.textContent = entry.target.getAttribute('data-target');
        } else {
          animateCounter(entry.target);
        }
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.counter').forEach((el) => {
    counterObserver.observe(el);
  });

  // 4. Video Playback
  const videoContainers = document.querySelectorAll('.grid-tile-video-container');
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector('video');
      if (video && !prefersReducedMotion.matches) {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, { threshold: 0.1 });

  videoContainers.forEach((container) => {
    videoObserver.observe(container);
  });

  // 5. Magnetic Proximity Cursor Element
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (hasFinePointer && !prefersReducedMotion.matches) {
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    const threshold = 100; // 100px radius

    document.addEventListener('mousemove', (e) => {
      const { clientX, clientY } = e;
      
      magneticBtns.forEach((btn) => {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (rect.width / 2 + threshold)) {
          // Inside magnetic field
          const tx = (dx / distance) * 12; // Max 12px translation
          const ty = (dy / distance) * 12;
          btn.style.transform = `translate(${tx}px, ${ty}px)`;
          btn.style.transition = 'transform 0.1s linear';
        } else {
          // Outside
          btn.style.transform = '';
          btn.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
        }
      });
    });
  }
});
