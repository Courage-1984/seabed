import './style.css';

/**
 * 78 North Supply — Main Entry & Motion Controllers
 * Implements Intersection Observer for gentle scroll reveal (§6 Motion #2)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Intersection Observer for Scroll Reveal
  const revealElements = document.querySelectorAll('.scroll-reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.15,
      }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    // Fallback for older environments without IntersectionObserver
    revealElements.forEach((element) => element.classList.add('is-revealed'));
  }
});
