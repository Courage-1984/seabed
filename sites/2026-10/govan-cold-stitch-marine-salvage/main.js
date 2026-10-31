import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Header scroll border elevation
  const header = document.querySelector('.site-header');
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // 2. IntersectionObserver for standard scroll-reveal blocks
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal-block, .schematic-box').forEach(el => {
    revealObserver.observe(el);
  });

  // 3. Split-Screen Scroll: Pinned rail stage updating across scroll breakpoints
  const splitSections = document.querySelectorAll('.split-screen-section');
  splitSections.forEach(section => {
    const slides = section.querySelectorAll('.split-slide');
    const contentBlocks = section.querySelectorAll('.split-content-block');
    const railTabs = section.querySelectorAll('.rail-step-tab');

    if (!slides.length || !contentBlocks.length) return;

    const activateSlide = (index) => {
      slides.forEach((slide, i) => {
        if (i === index) {
          slide.classList.add('is-active');
        } else {
          slide.classList.remove('is-active');
        }
      });

      if (railTabs.length) {
        railTabs.forEach((tab, i) => {
          if (i === index) {
            tab.classList.add('is-active');
          } else {
            tab.classList.remove('is-active');
          }
        });
      }
    };

    // Trigger when a station block scrolls past mid-screen
    const blockObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-station-index'), 10);
          if (!isNaN(index)) {
            activateSlide(index);
          }
        }
      });
    }, {
      rootMargin: '-20% 0px -40% 0px',
      threshold: 0.1
    });

    contentBlocks.forEach((block, idx) => {
      block.setAttribute('data-station-index', idx);
      blockObserver.observe(block);
    });
  });

  // 4. Video loop optimization: Pause loop when off-screen
  const videoElements = document.querySelectorAll('video');
  if (videoElements.length > 0 && 'IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const vid = entry.target;
        if (entry.isIntersecting) {
          vid.play().catch(() => {});
        } else {
          vid.pause();
        }
      });
    }, { threshold: 0.1 });

    videoElements.forEach(vid => videoObserver.observe(vid));
  }

  // 5. Accessible damage docket submission handling
  const docketForm = document.querySelector('#casting-docket-form');
  const docketStatus = document.querySelector('#docket-feedback');
  if (docketForm && docketStatus) {
    docketForm.addEventListener('submit', (e) => {
      e.preventDefault();
      docketStatus.textContent = 'Transmission verified. Dock Superintendent notified for Govan slipway dispatch triage within 4 hours.';
      docketStatus.style.display = 'block';
      docketForm.reset();
    });
  }
});
