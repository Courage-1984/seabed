// K9 Kinetic Recovery - Main JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Horizontal Scroll Logic for Methodology Page
  const horizontalWrapper = document.getElementById('horizontal-wrapper');
  
  if (horizontalWrapper) {
    // Listen to wheel events to convert vertical scrolling into horizontal scrolling
    window.addEventListener('wheel', (evt) => {
      // Don't override if screen is small (where flex-direction is column)
      if (window.innerWidth <= 768) return;

      // Prevent default vertical scroll
      evt.preventDefault();
      
      // Manually adjust the scroll position of the wrapper
      horizontalWrapper.scrollLeft += evt.deltaY;
      
      // If we are at the end, we could allow default scrolling, but for a strict single horizontal page, this is fine
    }, { passive: false });
  }

  // Smooth appearance for cards (optional micro-animation)
  const cards = document.querySelectorAll('.card');
  if (cards.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
          }, index * 100);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    cards.forEach(card => {
      card.style.opacity = 0;
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });
  }
});
