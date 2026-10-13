import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Signature Effect: Staggered Letter-by-Letter Headline
  const headline = document.querySelector('h1.staggered-headline');
  if (headline && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const textNode = headline.querySelector('noscript');
    let text = '';
    if (textNode) {
      text = textNode.textContent.trim();
    } else {
      text = headline.textContent.trim();
    }
    
    headline.innerHTML = '<noscript>' + text + '</noscript>'; // keep noscript
    
    let delay = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === ' ') {
        headline.appendChild(document.createTextNode(' '));
      } else {
        const span = document.createElement('span');
        span.textContent = char;
        span.className = 'char';
        span.style.transitionDelay = `${delay}ms`;
        headline.appendChild(span);
        delay += 25; // 25ms stagger
      }
    }
    
    // Trigger animation
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelectorAll('.char').forEach(el => el.classList.add('visible'));
      }, 100);
    });
  }

  // 2. Scroll-Reveal System
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.blueprint-reveal').forEach((el, i) => {
      el.style.transitionDelay = `${i * 80}ms`;
      observer.observe(el);
    });
  } else {
    document.querySelectorAll('.blueprint-reveal').forEach((el) => {
      el.classList.add('is-visible');
    });
  }

  // 3. Layout Family Signature Motion: Horizontal Band scaling/rotation
  const scrollTrack = document.getElementById('armature-registry');
  const cards = document.querySelectorAll('.armature-card');
  
  if (scrollTrack && cards.length > 0) {
    const updateCards = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      
      const trackRect = scrollTrack.getBoundingClientRect();
      const trackCenter = trackRect.left + trackRect.width / 2;
      
      cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        // Distance from center, normalized
        const dist = cardCenter - trackCenter;
        const normalizedDist = Math.max(-1, Math.min(1, dist / (trackRect.width / 2)));
        
        const scale = 1 - Math.abs(normalizedDist) * 0.08;
        // Rotation: 0deg on mobile (under 768px), up to 1.5deg on desktop
        const maxRotation = window.innerWidth < 768 ? 0 : 1.5;
        const rotate = normalizedDist * maxRotation;
        
        card.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
      });
    };
    
    scrollTrack.addEventListener('scroll', updateCards, { passive: true });
    window.addEventListener('resize', updateCards, { passive: true });
    updateCards(); // initial call
  }

  // 4. Video Intersection Observer to pause when out of view
  const videoSlot = document.querySelector('.hover-reveal-slot');
  const videoElement = videoSlot?.querySelector('video');
  if (videoSlot && videoElement) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          videoElement.pause();
        }
      });
    });
    videoObserver.observe(videoSlot);

    // Ensure hover/focus actually plays the video if supported
    const playVideo = () => {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        videoElement.play().catch(() => {});
      }
    };
    const pauseVideo = () => {
      videoElement.pause();
    };

    videoSlot.addEventListener('mouseenter', playVideo);
    videoSlot.addEventListener('mouseleave', pauseVideo);
    videoSlot.addEventListener('focusin', playVideo);
    videoSlot.addEventListener('focusout', pauseVideo);
  }

  // 5. Crosshair Follower on technical areas
  const crossH = document.querySelector('.crosshair-h');
  const crossV = document.querySelector('.crosshair-v');
  const trackAreas = document.querySelectorAll('.pointer-track-area');
  
  if (crossH && crossV && window.matchMedia('(pointer: fine)').matches) {
    let isTracking = false;
    
    document.addEventListener('mousemove', (e) => {
      if (!isTracking) return;
      crossH.style.top = `${e.clientY}px`;
      crossV.style.left = `${e.clientX}px`;
    }, { passive: true });
    
    trackAreas.forEach(area => {
      area.addEventListener('mouseenter', () => {
        document.body.classList.add('show-crosshair');
        isTracking = true;
      });
      area.addEventListener('mouseleave', () => {
        document.body.classList.remove('show-crosshair');
        isTracking = false;
      });
    });
  }
});
