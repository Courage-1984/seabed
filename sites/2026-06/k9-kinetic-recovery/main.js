import './style.css';

// K9 Kinetic Recovery - Main JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // Smooth card appearance (IntersectionObserver)
  // ==========================================
  const cards = document.querySelectorAll('.card');
  if (cards.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.style.opacity = 1;
              entry.target.style.transform = 'translateY(0)';
            }, index * 100);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    cards.forEach((card) => {
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

  expandableRows.forEach((row) => {
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
    document.querySelectorAll('.table-detail').forEach((dr) => {
      dr.hidden = true;
    });
    document.querySelectorAll('.expand-btn').forEach((b) => {
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

      currentStep = stepNumber;
    }

    // Next buttons
    k9Form.querySelectorAll('.k9-btn-next').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextStep = parseInt(btn.dataset.next);
        const currentStepEl = k9Form.querySelector(`.k9-form-step[data-step="${currentStep}"]`);
        const requiredFields = currentStepEl.querySelectorAll('[required]');
        let valid = true;

        requiredFields.forEach((field) => {
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
    k9Form.querySelectorAll('.k9-btn-prev').forEach((btn) => {
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

  k9AccordionTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      // Close all panels in the same accordion
      const accordion = trigger.closest('.k9-accordion');
      if (accordion) {
        accordion.querySelectorAll('.k9-accordion-trigger').forEach((otherTrigger) => {
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
 * Signature effect — sticky section pinning with cross-fade.
 * The stage pins while its panels cross-fade through in sequence. The
 * active index comes from how far the scroller has travelled through
 * its own height, so it never depends on any one panel's position.
 * ------------------------------------------------------------------ */
function initEffect() {
  const stage = document.querySelector('[data-pin-stage]');
  if (!stage) return;
  const panels = [...stage.querySelectorAll('[data-pin-panel]')];
  if (panels.length < 2) return;

  const scroller = stage.closest('[data-pin-scroller]') || stage.parentElement;

  const setActive = (index) => {
    panels.forEach((panel, i) => {
      panel.classList.toggle('is-active', i === index);
      // Inert panels are stacked underneath, so they must not be reachable.
      panel.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
  };

  if (reduceMotion.matches) {
    // No pinning to ride, so every panel is simply shown in flow. The scroller
    // is marked too: its extra height exists only to give the pin travel, and
    // without the pin it would be a screen of empty space.
    stage.classList.add('is-static');
    scroller.classList.add('is-static');
    panels.forEach((panel) => {
      panel.classList.add('is-active');
      panel.removeAttribute('aria-hidden');
    });
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = scroller.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    if (travel <= 0) {
      setActive(0);
      return;
    }
    const progress = Math.min(1, Math.max(0, -rect.top / travel));
    // Nudged off the exact boundary so the last panel gets a full share.
    setActive(Math.min(panels.length - 1, Math.floor(progress * panels.length * 0.999)));
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ------------------------------------------------------------------ *
 * Video placement — the loop only decodes while it is on screen.
 * Absent until the generated clip is installed, so this is a no-op
 * while the slot still shows its still frame.
 * ------------------------------------------------------------------ */
function initSlotVideo() {
  // Driven by its own interaction, not by viewport intersection.
  const video = document.querySelector('[data-slot-video]:not([data-slot-hover] [data-slot-video])');
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
/* ------------------------------------------------------------------ *
 * Video placement — hover reveal.
 * The opacity swap is CSS; this drives playback and lets the pass
 * finish rather than cutting mid-frame when the pointer leaves.
 * ------------------------------------------------------------------ */
function initHoverSlot() {
  const slot = document.querySelector('[data-slot-hover]');
  if (!slot) return;
  let finishing = false;
  const play = () => {
    const video = slot.querySelector('[data-slot-video]');
    if (!video || reduceMotion.matches) return;
    finishing = false;
    video.loop = true;
    video.play().catch(() => {});
  };
  const stop = () => {
    const video = slot.querySelector('[data-slot-video]');
    if (!video || video.paused) return;
    finishing = true;
    video.loop = false;
    video.addEventListener('ended', () => {
      if (!finishing) return;
      finishing = false;
      video.loop = true;
      video.pause();
      video.currentTime = 0;
    }, { once: true });
  };
  slot.addEventListener('pointerenter', play);
  slot.addEventListener('pointerleave', stop);
  slot.addEventListener('focusin', play);
  slot.addEventListener('focusout', stop);
}

document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initEffect();
  initSlotVideo();
  initHoverSlot();
});
