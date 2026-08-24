import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Overlapping card stack compression effect
  const cards = document.querySelectorAll('.card-stack .stack-card');
  
  if (cards.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // When a card hits the sticky top position, we want to compress the one behind it
        if (entry.isIntersecting && entry.intersectionRatio === 1) {
          const index = Array.from(cards).indexOf(entry.target);
          if (index > 0) {
            cards[index - 1].classList.add('is-compressed');
          }
        } else {
          const index = Array.from(cards).indexOf(entry.target);
          if (index > 0) {
            cards[index - 1].classList.remove('is-compressed');
          }
        }
      });
    }, {
      root: null,
      rootMargin: '-15% 0px -85% 0px', // Trigger when hitting the top: 15vh sticky zone
      threshold: 1.0
    });

    cards.forEach(card => observer.observe(card));
  }
});
