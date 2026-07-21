import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('section');
  const timelineFill = document.querySelector('.timeline-fill');
  
  if (!timelineFill || sections.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '-40% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const index = Array.from(sections).indexOf(entry.target);
        if (index !== -1) {
          // If first section, it could be 0, but let's make it proportional.
          const percentage = ((index) / (sections.length - 1)) * 100;
          timelineFill.style.height = `${Math.max(0, Math.min(100, percentage))}%`;
        }
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    observer.observe(section);
  });
});
