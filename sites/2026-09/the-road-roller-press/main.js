import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // IntersectionObserver for scroll-reveal
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  document.querySelectorAll('.reveal-item').forEach((el, index) => {
    el.style.transitionDelay = `${index % 4 * 80}ms`;
    revealObserver.observe(el);
  });

  // Signature Effect: Progressive blur focus-pull on scroll
  const focusPullElements = document.querySelectorAll('.focus-pull');
  if (focusPullElements.length > 0) {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      focusPullElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        // Calculate how close the element center is to the viewport center (0 to 1)
        const elCenter = rect.top + rect.height / 2;
        const viewportCenter = windowHeight / 2;
        const distance = Math.abs(elCenter - viewportCenter);
        const maxDistance = windowHeight / 1.5;
        let factor = distance / maxDistance;
        factor = Math.min(Math.max(factor, 0), 1);
        
        // Blur ranges from 0 to 14px, opacity 1 to 0.35
        const blurValue = factor * 14;
        const opacityValue = 1 - (factor * 0.65);
        el.style.filter = `blur(${blurValue}px)`;
        el.style.opacity = opacityValue;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // Layout Family Signature Motion: Sticky rail active indicator
  const phaseIndicator = document.getElementById('rail-active-indicator');
  const phaseSections = document.querySelectorAll('.phase-block');
  const contentColumn = document.querySelector('.content-column');
  
  if (phaseIndicator && phaseSections.length > 0 && contentColumn) {
    const railScroll = () => {
      // Find the currently active phase
      let activeIndex = 0;
      let minDistance = Infinity;
      const viewportCenter = window.innerHeight / 2;

      phaseSections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const dist = Math.abs(rect.top - viewportCenter);
        if (dist < minDistance && rect.top < window.innerHeight) {
          minDistance = dist;
          activeIndex = index;
        }
      });

      // Update indicator position
      const step = 40; // distance between dots in CSS
      phaseIndicator.style.transform = `translateY(${activeIndex * step}px)`;
    };
    window.addEventListener('scroll', railScroll, { passive: true });
  }

  // Gauge Counter
  const psiGauge = document.getElementById('psi-gauge');
  if (psiGauge) {
    let counted = false;
    const countObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !counted) {
        counted = true;
        let current = 0;
        const target = 450;
        const step = () => {
          current += 5;
          psiGauge.textContent = current;
          if (current < target) {
            requestAnimationFrame(step);
          } else {
            psiGauge.textContent = target;
          }
        };
        requestAnimationFrame(step);
        countObserver.disconnect();
      }
    });
    countObserver.observe(psiGauge);
  }

  // Phase accordions (micro-interaction)
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const parent = trigger.parentElement;
      const isExpanded = parent.classList.contains('is-expanded');
      
      document.querySelectorAll('.accordion-item').forEach(item => {
        item.classList.remove('is-expanded');
      });

      if (!isExpanded) {
        parent.classList.add('is-expanded');
      }
    });
  });

  // Video Autoplay Observer
  const video = document.querySelector('video.process-demo-video');
  if (video) {
    // Only attempt to observe if reduced motion is false
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!mediaQuery.matches) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.intersectionRatio >= 0.5) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.5 });
      videoObserver.observe(video);
    }
  }
});
