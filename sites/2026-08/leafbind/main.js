import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Overlapping Card Stack scroll motion logic
  const cards = document.querySelectorAll('.card-stack-item');
  
  if (cards.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -40% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Card is roughly in the active reading zone
          entry.target.classList.add('is-active');
          entry.target.classList.remove('is-past');
        } else {
          entry.target.classList.remove('is-active');
          // If it's above the viewport (bounding rect top < 0), it's "past"
          if (entry.boundingClientRect.top < window.innerHeight / 2) {
            entry.target.classList.add('is-past');
          } else {
            entry.target.classList.remove('is-past');
          }
        }
      });
    }, observerOptions);

    cards.forEach(card => observer.observe(card));
  }
});
