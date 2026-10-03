import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Scroll-Reveal System & Stagger
  const revealBlocks = document.querySelectorAll('.reveal-block');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('is-active');
        }, index * 80); // 80ms stagger
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });

  if (!prefersReducedMotion) {
    revealBlocks.forEach(block => revealObserver.observe(block));
  }

  // 2. Telemetry Decode (Supporting Motion 2)
  const decodeElements = document.querySelectorAll('.decode-text');
  
  if (!prefersReducedMotion) {
    decodeElements.forEach(el => {
      const targetText = el.getAttribute('data-target');
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789°'-";
      let iteration = 0;
      
      const interval = setInterval(() => {
        el.innerText = targetText
          .split("")
          .map((letter, index) => {
            if(index < iteration) return targetText[index];
            if(targetText[index] === ' ') return ' ';
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");
        
        if (iteration >= targetText.length) {
          clearInterval(interval);
        }
        
        iteration += 1 / 3;
      }, 30);
    });
  } else {
    // If reduced motion, set instantly
    decodeElements.forEach(el => {
      el.innerText = el.getAttribute('data-target');
    });
  }

  // 3. Scroll-Driven Clip-Path Wipe (Section 3)
  const clipWipeContainer = document.querySelector('.clip-wipe-container');
  const manifestBlock = document.getElementById('cargo-manifest');

  if (clipWipeContainer && manifestBlock && !prefersReducedMotion) {
    const updateClipPath = () => {
      const rect = manifestBlock.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how far we are into the section
      // 0 when top of section hits bottom of viewport
      // 1 when top of section reaches top of viewport
      let progress = 0;
      
      if (rect.top <= windowHeight && rect.bottom >= 0) {
        const totalScrollDistance = windowHeight;
        const currentScroll = windowHeight - rect.top;
        progress = currentScroll / totalScrollDistance;
        progress = Math.max(0, Math.min(1, progress));
      } else if (rect.top < 0) {
        progress = 1;
      }
      
      const percentage = (progress * 100).toFixed(2);
      clipWipeContainer.style.clipPath = `polygon(0 0, 100% 0, 100% ${percentage}%, 0 ${percentage}%)`;
    };

    window.addEventListener('scroll', updateClipPath, { passive: true });
    updateClipPath();
  }

  // 4. Video Pause/Play (Masked Type Fill)
  const video = document.querySelector('.masked-video');
  const videoContainer = document.querySelector('.masked-video-container');

  if (video) {
    const checkVideoLoad = () => {
      if (video.readyState >= 2) {
        videoContainer.classList.add('has-video');
      }
    };
    video.addEventListener('loadeddata', checkVideoLoad);
    checkVideoLoad();

    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !prefersReducedMotion) {
          video.play().catch(e => console.warn('Autoplay prevented:', e));
        } else {
          video.pause();
        }
      });
    }, { threshold: 0 });
    
    videoObserver.observe(videoContainer);
  }
});
