import './style.css';

// Layered Parallax Implementation
document.addEventListener('DOMContentLoaded', () => {
  const parallaxElements = document.querySelectorAll('[data-speed]');
  
  // Throttle function for performance
  let ticking = false;

  const updateParallax = () => {
    const scrollY = window.scrollY;
    
    parallaxElements.forEach(el => {
      const speed = parseFloat(el.getAttribute('data-speed'));
      // Calculate the offset. 
      // Speed < 1 moves slower than scroll (appears further away)
      // Speed > 1 moves faster than scroll (appears closer)
      // The translation is calculated based on the scroll position.
      const yOffset = scrollY * (1 - speed);
      
      // Use translate3d for hardware acceleration
      el.style.transform = `translate3d(0, ${yOffset}px, 0)`;
    });
    
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  });
  
  // Initial call to set positions
  updateParallax();
});

document.querySelectorAll('.hover-reveal-container').forEach(c => { const v = c.querySelector('video'); if (v) { c.addEventListener('mouseenter', () => v.play()); c.addEventListener('mouseleave', () => v.pause()); } });
