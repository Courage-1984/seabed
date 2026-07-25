import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Parallax effect for massive full-bleed images
  const parallaxImages = document.querySelectorAll('.parallax-img');
  
  const handleScroll = () => {
    const scrollY = window.scrollY;
    
    parallaxImages.forEach(img => {
      const parent = img.parentElement;
      const parentTop = parent.offsetTop;
      const parentHeight = parent.offsetHeight;
      const windowHeight = window.innerHeight;
      
      // Calculate if element is in viewport
      if (scrollY + windowHeight > parentTop && scrollY < parentTop + parentHeight) {
        // Calculate offset percentage (-0.1 to 0.1)
        const scrollPercent = (scrollY + windowHeight - parentTop) / (windowHeight + parentHeight);
        const yOffset = (scrollPercent - 0.5) * 20; // max 20% translation
        
        img.style.transform = `translateY(${yOffset}%)`;
      }
    });
  };

  // Initial call and event listener
  handleScroll();
  window.addEventListener('scroll', () => {
    window.requestAnimationFrame(handleScroll);
  });

  // Intersection Observer for fade-up text animations
  const fadeUpElements = document.querySelectorAll('.fade-up');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1
  });

  fadeUpElements.forEach(el => {
    observer.observe(el);
  });
});
