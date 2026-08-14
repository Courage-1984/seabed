import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.gear-card');
  const navLinks = document.querySelectorAll('.scrollspy-list a');

  if (!cards.length || !navLinks.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5 // trigger when item is halfway in viewport
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Remove active class from all
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Add active class to corresponding nav link
        const targetId = entry.target.getAttribute('id');
        const activeLink = document.querySelector(`.scrollspy-list a[href="#${targetId}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  }, observerOptions);

  cards.forEach(card => observer.observe(card));
});
