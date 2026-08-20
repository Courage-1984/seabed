import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Sticky rail scroll tracker for formulations section
  const observerOptions = {
    root: null,
    rootMargin: '-50% 0px -50% 0px', // Trigger when element is in the middle of the viewport
    threshold: 0
  };

  const navLinks = document.querySelectorAll('#rail-index a');
  const articles = document.querySelectorAll('.formulations-content article');

  if (navLinks.length > 0 && articles.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          // Remove active from all
          navLinks.forEach(link => link.classList.remove('active'));
          // Add active to current
          const activeLink = document.querySelector(`#rail-index a[href="#${id}"]`);
          if (activeLink) {
            activeLink.classList.add('active');
            
            // On mobile, scroll the horizontal nav to keep the active item in view
            if (window.innerWidth < 1024) {
              activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
          }
        }
      });
    }, observerOptions);

    articles.forEach(article => observer.observe(article));
  }
});
