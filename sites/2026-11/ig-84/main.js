import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  initFocusPullReveal();
  initHoverRevealVideo();
  initCardStackMotion();
  initSurveyForm();
});

/**
 * Signature Effect: Progressive Blur Focus-Pull
 * Observes .focus-pull-element items, transitioning them from a 4px blur
 * and 0.85 opacity to sharp focus as they cross the viewport threshold.
 */
function initFocusPullReveal() {
  const elements = document.querySelectorAll('.focus-pull-element');
  if (!elements.length) return;

  // Reduced motion check
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('is-focused'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        // Staggered focus resolution
        setTimeout(() => {
          entry.target.classList.add('is-focused');
        }, idx * 60);
        obs.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.12
  });

  elements.forEach(el => observer.observe(el));
}

/**
 * Video Slot: Hover Reveal Interaction
 * Switches poster still to playing 4K diagnostic video loop on hover, focus,
 * or touch interaction, with seamless fallback if video is unready.
 */
function initHoverRevealVideo() {
  const container = document.getElementById('video-reveal-container');
  const video = document.getElementById('multispectral-video');
  if (!container || !video) return;

  let isPlaying = false;

  const playVideo = async () => {
    container.classList.add('is-active');
    try {
      if (video.paused) {
        await video.play();
        isPlaying = true;
      }
    } catch {
      // Autoplay policy or video not yet present; poster remains visible
    }
  };

  const pauseVideo = () => {
    container.classList.remove('is-active');
    if (!video.paused) {
      video.pause();
      isPlaying = false;
    }
  };

  // Hover events (pointer-fine)
  container.addEventListener('mouseenter', playVideo);
  container.addEventListener('mouseleave', pauseVideo);

  // Keyboard accessibility (focus / blur)
  container.addEventListener('focus', playVideo);
  container.addEventListener('blur', pauseVideo);

  // Touch device toggle
  container.addEventListener('click', () => {
    if (isPlaying) {
      pauseVideo();
    } else {
      playVideo();
    }
  });

  // Handle escape key
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      pauseVideo();
      container.blur();
    }
  });
}

/**
 * Layout Family Signature: Overlapping Card-Stack
 * Scroll-driven z-axis layering and subtle depth shifts on sticky cards.
 */
function initCardStackMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 768) return;

  const cards = document.querySelectorAll('.stack-card');
  if (!cards.length) return;

  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        cards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          // Progress of card through the viewport
          const progress = Math.max(0, Math.min(1, (viewportHeight - rect.top) / (viewportHeight * 0.75)));
          
          if (rect.top <= 140) {
            // Card is pinned / stacking; scale slightly
            card.style.transform = `scale(${Math.max(0.96, 1 - (140 - rect.top) * 0.0003)})`;
          } else {
            card.style.transform = `scale(1)`;
          }
        });
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
}

/**
 * Curatorial Consignment Survey Form Handling
 */
function initSurveyForm() {
  const form = document.getElementById('collection-survey-form');
  const feedback = document.getElementById('survey-feedback');
  if (!form || !feedback) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const instName = document.getElementById('institution-name')?.value || 'Your institution';
    
    feedback.textContent = `Survey request received for ${instName}. The Senior Paleographic Conservation team at Cambridge will review the collection data and dispatch initial diagnostic parameters within 24 hours.`;
    feedback.className = 'form-feedback success';
    form.reset();
  });
}
