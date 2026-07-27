import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // Commission Form Submission
  // ==========================================
  const form = document.getElementById('commission-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      
      btn.textContent = 'Submitting...';
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = 'Brief Submitted';
        btn.style.backgroundColor = '#4caf50';
        btn.style.color = '#fff';
        
        setTimeout(() => {
          form.reset();
          btn.textContent = originalText;
          btn.disabled = false;
          btn.style.backgroundColor = '';
          btn.style.color = '';
        }, 3000);
      }, 1500);
    });
  }

  // ==========================================
  // Smooth Scrolling for Anchor Links
  // ==========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });

  // ==========================================
  // Carousel Logic
  // ==========================================
  const carousel = document.getElementById('forge-carousel');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');

  if (carousel && prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: -carousel.clientWidth, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: carousel.clientWidth, behavior: 'smooth' });
    });
  }

  // ==========================================
  // Timeline Animation (IntersectionObserver)
  // ==========================================
  const timelineItems = document.querySelectorAll('.timeline-item');
  
  if (timelineItems.length > 0) {
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, index * 150);
          timelineObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    timelineItems.forEach(item => {
      timelineObserver.observe(item);
    });
  }

  // ==========================================
  // Bento Item Hover Parallax Effect
  // ==========================================
  const bentoItems = document.querySelectorAll('.bento-item:not(.image-cell)');
  
  bentoItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
      item.style.transform = 'translateY(-4px)';
      item.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'translateY(0)';
      item.style.boxShadow = 'none';
    });
  });
});
