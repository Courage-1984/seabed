import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  // Sticky Header on Scroll
  const header = document.querySelector('.site-header');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Intersection Observer for scroll animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(section => {
    observer.observe(section);
  });

  // Booking Form Submission Handler
  const bookingForm = document.getElementById('booking-form');
  const formFeedback = document.getElementById('form-feedback');

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Simulate an API call
      const btn = bookingForm.querySelector('.submit-btn');
      const originalText = btn.textContent;
      btn.textContent = 'Processing...';
      btn.disabled = true;

      setTimeout(() => {
        formFeedback.textContent = 'Thank you. Your enquiry has been received. Our concierge will contact you within 24 hours.';
        formFeedback.style.color = 'var(--color-text)';
        bookingForm.reset();
        btn.textContent = originalText;
        btn.disabled = false;
        
        // Hide message after a while
        setTimeout(() => {
          formFeedback.textContent = '';
        }, 5000);
      }, 1500);
    });
  }
});

