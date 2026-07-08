// K9 Kinetic Recovery - Main JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // Smooth card appearance (IntersectionObserver)
  // ==========================================
  const cards = document.querySelectorAll('.card');
  if (cards.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
          }, index * 100);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    cards.forEach(card => {
      card.style.opacity = 0;
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });
  }

  // ==========================================
  // Carousel Logic
  // ==========================================
  const carousel = document.getElementById('k9-carousel');
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
  // Data Table Expandable Rows
  // ==========================================
  const expandableRows = document.querySelectorAll('.table-row-expandable');
  
  expandableRows.forEach(row => {
    const detailId = row.dataset.detail;
    const detailRow = document.getElementById(detailId);
    const expandBtn = row.querySelector('.expand-btn');

    if (detailRow && expandBtn) {
      // Click on the entire row
      row.addEventListener('click', () => {
        toggleDetailRow(detailRow, expandBtn);
      });
    }
  });

  function toggleDetailRow(detailRow, btn) {
    const isHidden = detailRow.hidden;

    // Close all detail rows
    document.querySelectorAll('.table-detail').forEach(dr => {
      dr.hidden = true;
    });
    document.querySelectorAll('.expand-btn').forEach(b => {
      b.textContent = '+';
    });

    // Toggle current
    if (isHidden) {
      detailRow.hidden = false;
      btn.textContent = '−';
    }
  }

  // ==========================================
  // K9 Multi-Step Form Logic
  // ==========================================
  const k9Form = document.getElementById('deployment-form');

  if (k9Form) {
    const steps = k9Form.querySelectorAll('.k9-form-step');
    const progressSteps = document.querySelectorAll('.k9-progress-step');
    let currentStep = 1;

    function showK9Step(stepNumber) {
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

      currentStep = stepNumber;
    }

    // Next buttons
    k9Form.querySelectorAll('.k9-btn-next').forEach(btn => {
      btn.addEventListener('click', () => {
        const nextStep = parseInt(btn.dataset.next);
        const currentStepEl = k9Form.querySelector(`.k9-form-step[data-step="${currentStep}"]`);
        const requiredFields = currentStepEl.querySelectorAll('[required]');
        let valid = true;

        requiredFields.forEach(field => {
          if (!field.checkValidity()) {
            field.reportValidity();
            valid = false;
          }
        });

        if (valid) {
          showK9Step(nextStep);
        }
      });
    });

    // Prev buttons
    k9Form.querySelectorAll('.k9-btn-prev').forEach(btn => {
      btn.addEventListener('click', () => {
        const prevStep = parseInt(btn.dataset.prev);
        showK9Step(prevStep);
      });
    });

    // Form submission
    k9Form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = k9Form.querySelector('.k9-btn-submit');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.textContent = 'Application Submitted';
        submitBtn.style.backgroundColor = '#4caf50';
        
        setTimeout(() => {
          k9Form.reset();
          showK9Step(1);
          submitBtn.textContent = originalText;
          submitBtn.style.backgroundColor = '';
          submitBtn.disabled = false;
        }, 3000);
      }, 1500);
    });

    showK9Step(1);
  }

  // ==========================================
  // K9 Accordion Logic
  // ==========================================
  const k9AccordionTriggers = document.querySelectorAll('.k9-accordion-trigger');

  k9AccordionTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      // Close all panels in the same accordion
      const accordion = trigger.closest('.k9-accordion');
      if (accordion) {
        accordion.querySelectorAll('.k9-accordion-trigger').forEach(otherTrigger => {
          const otherPanel = document.getElementById(otherTrigger.getAttribute('aria-controls'));
          otherTrigger.setAttribute('aria-expanded', 'false');
          if (otherPanel) {
            otherPanel.hidden = true;
            otherPanel.style.maxHeight = null;
          }
        });
      }

      if (!isExpanded && panel) {
        trigger.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
});
