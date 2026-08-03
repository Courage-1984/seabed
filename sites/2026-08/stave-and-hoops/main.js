import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Asymmetric Margin Shift (CSS) based on scroll
  const overlappingGraphic = document.querySelector('.stave-graphic-overlap');
  
  if (overlappingGraphic) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      // Subtly shift -10px horizontally on scroll
      const shift = Math.min(Math.max(-10, -(scrollY * 0.05)), 0);
      overlappingGraphic.style.transform = `translateX(${shift}px)`;
    });
  }
});
