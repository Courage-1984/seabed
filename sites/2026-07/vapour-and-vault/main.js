import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Depth Gauge scroll indicator for desktop
  const panelRight = document.querySelector('.panel-right');
  const depthIndicator = document.getElementById('depth-indicator');
  
  if (panelRight && depthIndicator) {
    panelRight.addEventListener('scroll', () => {
      const scrollTop = panelRight.scrollTop;
      const scrollHeight = panelRight.scrollHeight - panelRight.clientHeight;
      
      if (scrollHeight > 0) {
        const scrollPercentage = scrollTop / scrollHeight;
        depthIndicator.style.top = `${scrollPercentage * 100}%`;
      }
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href').substring(1);
      const targetEl = document.getElementById(targetId);
      
      if (targetEl) {
        if (panelRight && window.innerWidth >= 900) {
          // Inside scrolling container
          targetEl.scrollIntoView({ behavior: 'smooth' });
        } else {
          // Standard window scroll
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
});
