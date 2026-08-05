import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const stackCards = document.querySelectorAll('.stacked-card');
  const stackContainer = document.getElementById('performance-stack');
  
  if (stackCards.length > 0 && stackContainer) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Trigger the unfurl
          stackCards.forEach((card, index) => {
            // Apply slight fan out based on scroll interaction
            card.style.marginBottom = '10px';
            // Reset rotations slightly to a clean spread
            const rotations = [-2, 0, 1.5, 0];
            card.style.transform = `rotate(${rotations[index]}deg) translateY(${index * 5}px)`;
            
            // Add pulse to accent card (last one)
            if (index === stackCards.length - 1) {
              card.classList.add('active-pulse');
            }
          });
        }
      });
    }, { threshold: 0.3 });
    
    observer.observe(stackContainer);
    
    // Additional scroll listener to adjust offset slightly
    window.addEventListener('scroll', () => {
      const rect = stackContainer.getBoundingClientRect();
      // If stack is within viewport
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const progress = 1 - (rect.top / window.innerHeight);
        const clampProgress = Math.max(0, Math.min(1, progress));
        
        stackCards.forEach((card, index) => {
          // Adjust translateY slightly based on scroll
          if(index < stackCards.length - 1) {
            const currentTransform = card.style.transform.replace(/translateY\([^)]+\)/, '');
            card.style.transform = `${currentTransform} translateY(${index * clampProgress * -10}px)`;
          }
        });
      }
    });
  }
});
