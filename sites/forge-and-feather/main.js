import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('commission-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      
      btn.textContent = 'Submitting...';
      btn.disabled = true;

      // Simulate a network request
      setTimeout(() => {
        btn.textContent = 'Brief Submitted';
        btn.style.backgroundColor = '#4caf50';
        btn.style.color = '#fff';
        
        setTimeout(() => {
          form.reset();
          btn.textContent = originalText;
          btn.disabled = false;
          btn.style.backgroundColor = '';
          btn.style.color = '';
        }, 3000);
      }, 1500);
    });
  }

  // Smooth scrolling for anchor links (fallback for browsers without native smooth scrolling)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Offset for sticky header
          behavior: 'smooth'
        });
      }
    });
  });
});

