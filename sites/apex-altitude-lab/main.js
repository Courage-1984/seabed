import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('nav');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      menuToggle.textContent = nav.classList.contains('open') ? 'CLOSE [X]' : 'MENU [=]';
    });
  }

  // Active Nav Link highlighting
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    const linkPath = new URL(link.href).pathname;
    if (currentPath === linkPath || (currentPath === '/' && linkPath.includes('index.html'))) {
      link.classList.add('active');
    }
  });

  // Form Submission Logic
  const enquireForm = document.getElementById('enquire-form');
  if (enquireForm) {
    enquireForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const btn = enquireForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'TRANSMITTING...';
      btn.disabled = true;

      // Simulate a network request delay
      setTimeout(() => {
        btn.textContent = 'PROFILE SUBMITTED';
        btn.style.backgroundColor = 'var(--color-accent)';
        btn.style.color = 'var(--color-background)';
        enquireForm.reset();
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.backgroundColor = 'transparent';
          btn.style.color = 'var(--color-accent)';
          btn.disabled = false;
        }, 3000);
      }, 1500);
    });
  }
});

