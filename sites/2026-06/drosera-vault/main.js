document.addEventListener('DOMContentLoaded', () => {
  // Live Countdown Logic
  const countdownElements = document.querySelectorAll('[data-countdown]');
  
  countdownElements.forEach(el => {
    let secondsLeft = parseInt(el.getAttribute('data-countdown'), 10);
    
    const updateTimer = () => {
      if (secondsLeft <= 0) {
        el.textContent = "00:00:00";
        return;
      }
      
      const h = Math.floor(secondsLeft / 3600).toString().padStart(2, '0');
      const m = Math.floor((secondsLeft % 3600) / 60).toString().padStart(2, '0');
      const s = (secondsLeft % 60).toString().padStart(2, '0');
      
      el.textContent = `${h}:${m}:${s}`;
      secondsLeft--;
    };
    
    updateTimer();
    setInterval(updateTimer, 1000);
  });
});
