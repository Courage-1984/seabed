import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Split-Screen Hotspot Sync
  const sections = document.querySelectorAll('.split-section');
  const hotspots = {
    'hs-1': document.getElementById('hs-1'),
    'hs-2': document.getElementById('hs-2'),
    'hs-3': document.getElementById('hs-3')
  };

  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -50% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const targetHs = entry.target.getAttribute('data-hs');
        // Reset all
        Object.values(hotspots).forEach(hs => {
          if (hs) hs.classList.remove('active');
        });
        // Activate target
        if (hotspots[targetHs]) {
          hotspots[targetHs].classList.add('active');
        }
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // FAQ Accordion
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      item.classList.toggle('active');
    });
  });
});
