import './style.css';

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

  accordionTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      // Close all panels in the same accordion
      const accordion = trigger.closest('.accordion');
      if (accordion) {
        accordion.querySelectorAll('.accordion-trigger').forEach((otherTrigger) => {
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
      steps.forEach((step) => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) === stepNumber) {
          step.classList.add('active');
        }
      });

      progressSteps.forEach((ps) => {
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
    multistepForm.querySelectorAll('.btn-next').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextStep = parseInt(btn.dataset.next);

        // Validate current step's required fields
        const currentStepEl = multistepForm.querySelector(`.form-step[data-step="${currentStep}"]`);
        const requiredFields = currentStepEl.querySelectorAll('[required]');
        let valid = true;

        requiredFields.forEach((field) => {
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
    multistepForm.querySelectorAll('.btn-prev').forEach((btn) => {
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

/* ================================================================== *
 * Contract v2.1 motion system.
 * Appended rather than replacing this file: the site's own behaviour
 * above is still live. The reveal system keys off `data-reveal` and
 * `is-revealed`, so it does not collide with any existing observer.
 * ================================================================== */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ------------------------------------------------------------------ *
 * Motion budget 1 — staggered scroll-reveal system.
 * Fires once per element, never re-triggers.
 * ------------------------------------------------------------------ */
function initReveals() {
  const targets = [...document.querySelectorAll('[data-reveal]')];
  if (!targets.length) return;

  // Only hide content once we know JS is running and can bring it back. If the
  // script fails to load the page renders un-animated instead of blank.
  document.documentElement.classList.add('js-reveal');

  const show = (el) => {
    if (el.classList.contains('is-revealed')) return;
    const group = el.parentElement;
    const siblings = group ? [...group.querySelectorAll('[data-reveal]')] : [el];
    const step = Math.max(0, siblings.indexOf(el));
    el.style.setProperty('--reveal-delay', `${step * 80}ms`);
    el.classList.add('is-revealed');
  };

  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    targets.forEach(show);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
  );

  targets.forEach((el) => observer.observe(el));

  // Backstop: the observer can miss elements that arrive in view through an
  // anchor jump or a programmatic scroll, which would strand them invisible.
  const sweep = () => {
    for (const el of targets) {
      if (el.classList.contains('is-revealed')) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        show(el);
        observer.unobserve(el);
      }
    }
  };
  window.addEventListener('scroll', sweep, { passive: true });
  window.addEventListener('resize', sweep, { passive: true });
  window.addEventListener('hashchange', () => setTimeout(sweep, 600));
  setTimeout(sweep, 400);
}

/* ------------------------------------------------------------------ *
 * Signature effect — text scramble decode on reveal.
 * Each target resolves from random glyphs to its real text once, when
 * it first enters view. The original string is captured before the
 * first frame so a mid-animation reflow can never lose the content.
 * ------------------------------------------------------------------ */
const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#$%&*';

function initEffect() {
  const targets = [...document.querySelectorAll('[data-scramble]')];
  if (!targets.length) return;

  // Captured up front: the element's text is the source of truth, and the
  // animation overwrites it.
  const original = new WeakMap();
  for (const el of targets) original.set(el, el.textContent);

  if (reduceMotion.matches || !('IntersectionObserver' in window)) return;

  const decode = (el) => {
    const text = original.get(el);
    if (!text) return;
    const total = 28; // frames
    let frame = 0;
    const tick = () => {
      // Characters lock in left to right across the run.
      const locked = Math.floor((frame / total) * text.length);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        // Whitespace is never scrambled, so the line keeps its shape.
        if (i < locked || /\s/.test(ch)) out += ch;
        else out += SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
      }
      el.textContent = out;
      frame += 1;
      if (frame <= total) {
        requestAnimationFrame(tick);
      } else {
        // Always restore the exact original, never the last random frame.
        el.textContent = text;
      }
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        decode(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );
  targets.forEach((el) => observer.observe(el));
}

/* ------------------------------------------------------------------ *
 * Video placement — the loop only decodes while it is on screen.
 * Absent until the generated clip is installed, so this is a no-op
 * while the slot still shows its still frame.
 * ------------------------------------------------------------------ */
function initSlotVideo() {
  const video = document.querySelector('[data-slot-video]');
  if (!video) return;

  const apply = () => {
    if (reduceMotion.matches) {
      // Drop the attribute too, so the clip does not restart itself if the
      // element is re-attached or the source reloads.
      video.removeAttribute('autoplay');
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };
  reduceMotion.addEventListener('change', apply);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reduceMotion.matches) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.05 }
    );
    observer.observe(video);
  }
  apply();
}

// A second listener rather than editing the site's existing one — both fire.
document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initEffect();
  initSlotVideo();
});
