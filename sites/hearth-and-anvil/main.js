import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Intersection Observer for split line
  const splitContainer = document.querySelector('.split-container');
  if (splitContainer) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.2 });
    observer.observe(splitContainer);
  }

  // Intersection Observer for temperature counter
  const tempCounter = document.getElementById('temp-counter');
  if (tempCounter) {
    const tempObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(tempCounter, 0, 1200, 2000);
          tempObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    tempObserver.observe(tempCounter);
  }

  function animateCounter(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = Math.floor(progress * (end - start) + start);
      element.textContent = current.toLocaleString() + '°C';
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = end.toLocaleString() + '°C';
      }
    };
    window.requestAnimationFrame(step);
  }
});
