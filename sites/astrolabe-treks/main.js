document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll
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

  // Reveal animations on scroll
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
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

  const animateElements = document.querySelectorAll('.section-text, .section-image, .trek-card');
  animateElements.forEach(el => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    observer.observe(el);
  });

  // Form handling
  const vettingForm = document.getElementById('vetting-form');
  const formMessage = document.getElementById('form-message');

  if (vettingForm) {
    vettingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const enduranceSelect = document.getElementById('endurance');
      const submitBtn = vettingForm.querySelector('button[type="submit"]');
      
      submitBtn.textContent = 'Assessing...';
      submitBtn.disabled = true;
      
      setTimeout(() => {
        if (enduranceSelect.value === 'none') {
          formMessage.style.color = '#ff6b6b';
          formMessage.textContent = 'Assessment Failed: Expeditions require strict physical acclimatisation. Application rejected.';
        } else {
          formMessage.style.color = 'var(--color-accent)';
          formMessage.textContent = 'Assessment Submitted. Awaiting manual dispatch review.';
          vettingForm.reset();
        }
        
        submitBtn.textContent = 'Submit Assessment';
        submitBtn.disabled = false;
        
        setTimeout(() => {
          formMessage.textContent = '';
        }, 6000);
      }, 1200);
    });
  }
});
