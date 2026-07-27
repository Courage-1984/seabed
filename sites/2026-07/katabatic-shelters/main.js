import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Parallax Effect on Hero Image
  const heroImage = document.querySelector('.hero-image');
  if (heroImage) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY <= window.innerHeight) {
        document.documentElement.style.setProperty('--scroll-y', `${scrollY}px`);
      }
    }, { passive: true });
  }

  // 2. Sticky Rail Active State Tracker via IntersectionObserver
  const specBlocks = document.querySelectorAll('.spec-block');
  const railItems = document.querySelectorAll('.rail-item');

  if (specBlocks.length > 0 && railItems.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    const specObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          railItems.forEach((item) => {
            const target = item.getAttribute('data-target');
            if (target === id) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    specBlocks.forEach((block) => specObserver.observe(block));

    // Rail click smooth scroll fallback and state update
    railItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        const targetId = item.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          railItems.forEach((i) => i.classList.remove('active'));
          item.classList.add('active');
        }
      });
    });
  }

  // 3. Clinical Procurement Form Handling
  const procurementForm = document.getElementById('procurement-form');
  const formFeedback = document.getElementById('form-feedback');

  if (procurementForm && formFeedback) {
    procurementForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const institutionInput = document.getElementById('input-institution');
      const directorInput = document.getElementById('input-director');
      const institution = institutionInput ? institutionInput.value.trim() : 'Institutional Client';
      const director = directorInput ? directorInput.value.trim() : 'Operations Director';

      formFeedback.innerHTML = `
        <strong>PROCUREMENT TELEMETRY ACKNOWLEDGED</strong><br>
        Inquiry registered for <em>${institution}</em> under direction of ${director}.<br>
        A Senior Polar Structural Engineer from our Dundee Facility (DD1 3JA) will transmit architectural schematics and thermal validation protocols via encrypted link within 4 operational hours.
      `;
      formFeedback.className = 'form-feedback success';

      procurementForm.reset();
      
      // Smooth scroll to feedback message
      formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // 4. Download Schematics Simulated Telemetry Trigger
  const downloadBtn = document.getElementById('btn-download-schematics');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', (e) => {
      // If user clicks download schematics, scroll them to procurement contact smoothly
      const contactSection = document.getElementById('procurement-contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});
