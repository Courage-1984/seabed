import './style.css';

// Ticker Band Velocity
const tickerTracks = document.querySelectorAll('.marquee-track');
let lastScrollY = window.scrollY;
let lastTime = performance.now();
let velocity = 0;
let currentSpeedMultiplier = 1;
let tickerAnimationFrames = [];

// Apply Web Animations API to marquee tracks
tickerTracks.forEach(track => {
  const animation = track.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-50%)' }
  ], {
    duration: 25000,
    iterations: Infinity,
    easing: 'linear'
  });
  tickerAnimationFrames.push(animation);
});

function updateTicker() {
  const now = performance.now();
  const currentScrollY = window.scrollY;
  const deltaY = currentScrollY - lastScrollY;
  const dt = now - lastTime;

  if (dt > 0) {
    velocity = deltaY / dt;
  }
  
  // Calculate speed multiplier based on scroll velocity (up to 2.5x)
  const targetMultiplier = 1 + Math.min(Math.abs(velocity) * 2, 1.5);
  
  // Ease back to baseline
  currentSpeedMultiplier += (targetMultiplier - currentSpeedMultiplier) * 0.1;
  
  if (currentSpeedMultiplier < 1.01) currentSpeedMultiplier = 1;

  tickerAnimationFrames.forEach(animation => {
    animation.playbackRate = currentSpeedMultiplier;
  });

  lastScrollY = currentScrollY;
  lastTime = now;

  requestAnimationFrame(updateTicker);
}

// Only run motion if user prefers it
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion) {
  requestAnimationFrame(updateTicker);
}

// Sticky Section Pinning with Cross-Fade (Section 6: Anatomy)
const anatomySection = document.getElementById('anatomy-section');
const anatomyLayers = document.querySelectorAll('.anatomy-layer');
const textLayers = document.querySelectorAll('.anatomy-text-layer');

function updateStickySection() {
  if (!anatomySection || prefersReducedMotion) return;
  const rect = anatomySection.getBoundingClientRect();
  const sectionHeight = anatomySection.offsetHeight;
  const windowHeight = window.innerHeight;
  
  // Scroll range inside the 250vh container
  const scrollRange = sectionHeight - windowHeight;
  if (scrollRange <= 0) return;

  let pinnedProgress = -rect.top / scrollRange;
  
  if (pinnedProgress < 0) pinnedProgress = 0;
  if (pinnedProgress > 1) pinnedProgress = 1;

  let activeIndex = 0;
  if (pinnedProgress > 0.33 && pinnedProgress <= 0.66) activeIndex = 1;
  if (pinnedProgress > 0.66) activeIndex = 2;

  anatomyLayers.forEach((layer, idx) => {
    if (idx === activeIndex) {
      layer.classList.add('is-active');
    } else {
      layer.classList.remove('is-active');
    }
  });

  textLayers.forEach((layer, idx) => {
    if (idx === activeIndex) {
      layer.classList.add('is-active');
    } else {
      layer.classList.remove('is-active');
    }
  });
}

if (!prefersReducedMotion) {
  window.addEventListener('scroll', updateStickySection);
  // Initial call
  updateStickySection();
}

// IntersectionObserver Scroll-Reveal System
const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

if (!prefersReducedMotion) {
  document.querySelectorAll('.reveal-block').forEach(block => {
    observer.observe(block);
  });
}

// Tabular numbers roll-up
const statObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = entry.target;
      const targetVal = parseInt(target.getAttribute('data-target'), 10);
      let startVal = 0;
      const duration = 1500;
      const startTime = performance.now();
      
      function updateNumber(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.floor(easeOut * targetVal);
        target.textContent = currentVal;
        
        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        } else {
          target.textContent = targetVal;
        }
      }
      if (!prefersReducedMotion) {
        requestAnimationFrame(updateNumber);
      } else {
        target.textContent = targetVal;
      }
      obs.unobserve(target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.tabular-stat').forEach(stat => {
  statObserver.observe(stat);
});

// Live Wind Speed
const windSpeedEl = document.getElementById('wind-speed');
if (windSpeedEl && !prefersReducedMotion) {
  setInterval(() => {
    const baseWind = 65;
    const variance = Math.floor(Math.random() * 7) - 3; // -3 to +3
    windSpeedEl.textContent = baseWind + variance;
  }, 2500);
}

// Marquee Video autoplay strictly when in view
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const video = entry.target;
    if (entry.isIntersecting && !prefersReducedMotion) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
          playPromise.catch(() => {});
      }
    } else {
      video.pause();
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.marquee-video').forEach(vid => {
  videoObserver.observe(vid);
});
