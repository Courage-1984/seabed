import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Intersection Observer for typography shift
  const revealElements = document.querySelectorAll('.reveal-text');
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // SVG Tensile Line scroll animation
  const line = document.querySelector('.tensile-line line');
  if (line) {
    window.addEventListener('scroll', () => {
      // Calculate scroll percentage
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollRatio = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      
      // Update dashoffset (1000 is our starting offset to hide it, 0 is fully drawn)
      const offset = 1000 - (scrollRatio * 1000);
      line.style.strokeDashoffset = Math.max(0, offset).toString();
    });
  }
});
