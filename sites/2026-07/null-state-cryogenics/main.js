import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const clipElements = document.querySelectorAll('.clip-reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    threshold: 0.15
  });

  clipElements.forEach(el => observer.observe(el));
});
