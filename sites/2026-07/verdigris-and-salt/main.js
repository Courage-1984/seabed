import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Overlapping Card-Stack unfold on scroll
  const stacks = document.querySelectorAll('.card-stack');
  const stackObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('unfolded');
      }
    });
  }, { threshold: 0.2 });
  
  stacks.forEach(stack => stackObserver.observe(stack));

  // Pressure Gauge Telemetry
  const ataDisplay = document.getElementById('telemetry-ata');
  if (ataDisplay) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
      let progress = scrollY / maxScroll;
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;
      const currentAta = (1.0 + progress * 5.0).toFixed(1);
      ataDisplay.textContent = currentAta;
    });
  }
});
