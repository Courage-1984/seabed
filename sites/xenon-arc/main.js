document.addEventListener('DOMContentLoaded', () => {
  
  // Live UTC Clock
  const clockElement = document.getElementById('live-clock');
  
  function updateClock() {
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    const s = String(now.getUTCSeconds()).padStart(2, '0');
    clockElement.textContent = `${h}:${m}:${s} UTC`;
  }
  
  setInterval(updateClock, 1000);
  updateClock();

  // Dispatch Form Handling
  const dispatchForm = document.getElementById('dispatch-form');
  const formResponse = document.getElementById('form-response');

  if (dispatchForm) {
    dispatchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = dispatchForm.querySelector('button[type="submit"]');
      submitBtn.textContent = 'TRANSMITTING PROTOCOLS...';
      submitBtn.style.backgroundColor = 'var(--color-secondary)';
      submitBtn.style.color = 'var(--color-text)';
      submitBtn.disabled = true;

      // Simulate a network dispatch delay
      setTimeout(() => {
        formResponse.innerHTML = 'DEPLOYMENT AUTHORISED.<br>A LOGISTICS COMMANDER IS REVIEWING COORDINATES.';
        
        submitBtn.textContent = 'Initiate Clean-Room Deployment';
        submitBtn.style.backgroundColor = '';
        submitBtn.style.color = '';
        submitBtn.disabled = false;
        
        dispatchForm.reset();

        setTimeout(() => {
          formResponse.innerHTML = '';
        }, 8000);
      }, 2000);
    });
  }
});
