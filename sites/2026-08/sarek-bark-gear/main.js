import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const dossierBlocks = document.querySelectorAll('.dossier-block');
  const indexLinks = document.querySelectorAll('.sticky-index a');

  if (dossierBlocks.length === 0 || indexLinks.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        indexLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  dossierBlocks.forEach(block => observer.observe(block));
});
