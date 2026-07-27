import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('waitlist-form');
  const feedback = document.getElementById('form-feedback');
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const emailInput = document.getElementById('email-input');
      const email = emailInput.value.trim();
      
      if (email) {
        // Simulate an API call
        const button = form.querySelector('button');
        const originalText = button.textContent;
        button.textContent = 'TRANSMITTING...';
        button.disabled = true;
        
        setTimeout(() => {
          feedback.style.display = 'block';
          feedback.textContent = 'Transmission received. You are on the waitlist.';
          form.reset();
          
          button.textContent = originalText;
          button.disabled = false;
        }, 1500);
      }
    });
  }
});
