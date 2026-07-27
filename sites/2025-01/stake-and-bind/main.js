import './style.css';

/**
 * Stake & Bind — Interactive Mechanics & Motion Driver
 * Implements:
 * 1. Subtle parallax on hero image (0.5x scroll speed)
 * 2. Staggered fade-in on section entries (Intersection Observer)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Subtle Parallax on Hero Image
  const heroImage = document.querySelector('.hero-media-fullbleed img');
  if (heroImage) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY || window.pageYOffset;
      // 0.5x scroll speed downward translation for depth without distraction
      if (scrollY < 1200) {
        heroImage.style.transform = `translate3d(0, ${scrollY * 0.4}px, 0)`;
      }
    }, { passive: true });
  }

  // 2. Staggered Fade-In on Section Entries
  const animatedSections = document.querySelectorAll('.section-animate');
  
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Add slight stagger delay when multiple sections enter
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, index * 100);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedSections.forEach((section) => {
      sectionObserver.observe(section);
    });
  } else {
    // Fallback for browsers without IntersectionObserver
    animatedSections.forEach((section) => {
      section.classList.add('is-visible');
    });
  }
});
