document.addEventListener('DOMContentLoaded', () => {
  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Form handling
  const dispatchForm = document.getElementById('dispatch-form');
  const statusMessage = document.getElementById('form-status');

  if (dispatchForm) {
    dispatchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const btn = dispatchForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      
      // Simulate encrypted connection & processing
      btn.textContent = 'Encrypting Transmission...';
      btn.disabled = true;
      
      setTimeout(() => {
        statusMessage.style.color = 'var(--color-accent)';
        statusMessage.textContent = 'Transmission Secure. Drone Dispatch Initiated. Await further telemetry.';
        
        btn.textContent = originalText;
        btn.disabled = false;
        dispatchForm.reset();
        
        // Clear message after 5 seconds
        setTimeout(() => {
          statusMessage.textContent = '';
        }, 5000);
      }, 1500);
    });
  }

  // Intersection Observer for micro-animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.bento-item').forEach(item => {
    item.style.opacity = 0;
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(item);
  });
});
