import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // Mobile Nav Toggle
  // ==========================================
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('nav');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      menuToggle.textContent = nav.classList.contains('open') ? 'CLOSE [X]' : 'MENU [=]';
    });
  }

  // ==========================================
  // Carousel Logic
  // ==========================================
  const carousel = document.getElementById('apex-carousel');
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
  // Accordion Logic
  // ==========================================
  const accordionTriggers = document.querySelectorAll('.accordion-trigger');

  accordionTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      // Close all panels in the same accordion
      const accordion = trigger.closest('.accordion');
      if (accordion) {
        accordion.querySelectorAll('.accordion-trigger').forEach(otherTrigger => {
          const otherPanel = document.getElementById(otherTrigger.getAttribute('aria-controls'));
          otherTrigger.setAttribute('aria-expanded', 'false');
          if (otherPanel) {
            otherPanel.hidden = true;
            otherPanel.style.maxHeight = null;
          }
        });
      }

      // Toggle current panel
      if (!isExpanded && panel) {
        trigger.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  // ==========================================
  // Multi-Step Form Logic
  // ==========================================
  const multistepForm = document.getElementById('enquire-form');
  
  if (multistepForm && multistepForm.classList.contains('multistep-form')) {
    const steps = multistepForm.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressFill = document.getElementById('progress-fill');
    let currentStep = 1;

    function showStep(stepNumber) {
      steps.forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) === stepNumber) {
          step.classList.add('active');
        }
      });

      progressSteps.forEach(ps => {
        const psStep = parseInt(ps.dataset.step);
        ps.classList.remove('active', 'completed');
        if (psStep === stepNumber) {
          ps.classList.add('active');
        } else if (psStep < stepNumber) {
          ps.classList.add('completed');
        }
      });

      // Update progress bar fill
      const totalSteps = steps.length;
      const fillPercent = ((stepNumber - 1) / (totalSteps - 1)) * 100;
      if (progressFill) {
        progressFill.style.width = fillPercent + '%';
      }

      currentStep = stepNumber;
    }

    // Next buttons
    multistepForm.querySelectorAll('.btn-next').forEach(btn => {
      btn.addEventListener('click', () => {
        const nextStep = parseInt(btn.dataset.next);
        
        // Validate current step's required fields
        const currentStepEl = multistepForm.querySelector(`.form-step[data-step="${currentStep}"]`);
        const requiredFields = currentStepEl.querySelectorAll('[required]');
        let valid = true;
        
        requiredFields.forEach(field => {
          if (!field.checkValidity()) {
            field.reportValidity();
            valid = false;
          }
        });

        if (valid) {
          showStep(nextStep);
        }
      });
    });

    // Previous buttons
    multistepForm.querySelectorAll('.btn-prev').forEach(btn => {
      btn.addEventListener('click', () => {
        const prevStep = parseInt(btn.dataset.prev);
        showStep(prevStep);
      });
    });

    // Form submission
    multistepForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = multistepForm.querySelector('.btn-submit');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'TRANSMITTING...';
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.textContent = 'PROFILE SUBMITTED';
        submitBtn.style.backgroundColor = 'var(--color-accent)';
        submitBtn.style.color = 'var(--color-background)';
        
        setTimeout(() => {
          multistepForm.reset();
          showStep(1);
          submitBtn.textContent = originalText;
          submitBtn.style.backgroundColor = 'transparent';
          submitBtn.style.color = 'var(--color-accent)';
          submitBtn.disabled = false;
        }, 3000);
      }, 1500);
    });

    // Initialise
    showStep(1);

  } else if (multistepForm) {
    // Simple form submission (legacy fallback)
    multistepForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const btn = multistepForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'TRANSMITTING...';
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = 'PROFILE SUBMITTED';
        btn.style.backgroundColor = 'var(--color-accent)';
        btn.style.color = 'var(--color-background)';
        multistepForm.reset();
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.backgroundColor = 'transparent';
          btn.style.color = 'var(--color-accent)';
          btn.disabled = false;
        }, 3000);
      }, 1500);
    });
  }
});
