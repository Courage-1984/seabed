import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Motion 1 (Sticky Index Highlight)
  const observerOptions = {
    root: null,
    rootMargin: '-50% 0px -50% 0px',
    threshold: 0
  };

  const panes = document.querySelectorAll('.content-pane');
  const navLinks = document.querySelectorAll('.rail-link');
  const progressBar = document.getElementById('rail-progress');

  if (panes.length > 0 && navLinks.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index'), 10);
          
          navLinks.forEach(link => link.classList.remove('active'));
          navLinks[index].classList.add('active');

          const progressPercent = (index / (panes.length - 1)) * 100;
          if (progressBar) {
            progressBar.style.height = `${progressPercent}%`;
          }
        }
      });
    }, observerOptions);

    panes.forEach(pane => observer.observe(pane));
  }
});
