import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Motion 2 (Grid Entrance): Bento tiles reveal sequentially
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Staggered delay based on index for the bento items
        setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, index * 100);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const revealItems = document.querySelectorAll('.reveal-item');
  revealItems.forEach(item => {
    observer.observe(item);
  });
});
