import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Header Elevation on Scroll
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

  // 2. Scroll-Reveal IntersectionObserver
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if (revealElements.length > 0) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach((el) => el.classList.add('is-revealed'));
    } else {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      });

      revealElements.forEach((el) => revealObserver.observe(el));
    }
  }

  // 3. Signature Effect: Text Scramble Decode on Reveal
  const scrambleHeadline = document.querySelector('[data-scramble]');
  if (scrambleHeadline) {
    const originalText = scrambleHeadline.getAttribute('data-scramble') || scrambleHeadline.textContent.trim();
    const glyphs = 'λνΣΩ∮Δθπψκ440Hz0123456789±√';

    const runScramble = () => {
      if (prefersReducedMotion) {
        scrambleHeadline.textContent = originalText;
        return;
      }

      let iteration = 0;
      const totalSteps = originalText.length;
      const interval = setInterval(() => {
        scrambleHeadline.textContent = originalText
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return originalText[index];
            }
            return glyphs[Math.floor(Math.random() * glyphs.length)];
          })
          .join('');

        if (iteration >= totalSteps) {
          clearInterval(interval);
          scrambleHeadline.textContent = originalText;
        }
        iteration += 1.5;
      }, 25);
    };

    if ('IntersectionObserver' in window) {
      const scrambleObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runScramble();
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      scrambleObserver.observe(scrambleHeadline);
    } else {
      runScramble();
    }
  }

  // 4. Layout Family: Index / Ledger Row Expand-in-Place & Filters
  const ledgerRows = document.querySelectorAll('.ledger-row');
  const toggleAllBtn = document.getElementById('toggle-all-ledger-rows');
  const filterChips = document.querySelectorAll('.filter-chip');

  const toggleRow = (row, forceState = null) => {
    const btn = row.querySelector('.row-expand-btn');
    const targetId = btn ? btn.getAttribute('aria-controls') : null;
    const detailRow = targetId ? document.getElementById(targetId) : null;
    if (!detailRow) return;

    const isCurrentlyExpanded = row.classList.contains('is-expanded');
    const newState = forceState !== null ? forceState : !isCurrentlyExpanded;

    if (newState) {
      row.classList.add('is-expanded');
      detailRow.classList.add('is-visible');
      detailRow.removeAttribute('aria-hidden');
      if (btn) btn.setAttribute('aria-expanded', 'true');
    } else {
      row.classList.remove('is-expanded');
      detailRow.classList.remove('is-visible');
      detailRow.setAttribute('aria-hidden', 'true');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  };

  ledgerRows.forEach((row) => {
    // Click on row (or on button) toggles
    row.addEventListener('click', (e) => {
      // Don't duplicate if clicking a link or interactive child
      if (e.target.tagName.toLowerCase() === 'a') return;
      toggleRow(row);
    });

    // Keyboard support on row
    row.setAttribute('tabindex', '0');
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.tagName.toLowerCase() !== 'button') {
          e.preventDefault();
          toggleRow(row);
        }
      }
    });

    const btn = row.querySelector('.row-expand-btn');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleRow(row);
      });
    }
  });

  // Toggle All Rows
  if (toggleAllBtn) {
    let allExpanded = false;
    toggleAllBtn.addEventListener('click', () => {
      allExpanded = !allExpanded;
      ledgerRows.forEach((row) => {
        if (row.style.display !== 'none') {
          toggleRow(row, allExpanded);
        }
      });
      toggleAllBtn.setAttribute('aria-expanded', String(allExpanded));
      toggleAllBtn.textContent = allExpanded ? 'Collapse All Register Rows' : 'Expand All Register Rows';
    });
  }

  // Filter Chips
  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');

      const filterVal = chip.getAttribute('data-filter');
      ledgerRows.forEach((row) => {
        const category = row.getAttribute('data-category');
        const detailId = row.querySelector('.row-expand-btn')?.getAttribute('aria-controls');
        const detailRow = detailId ? document.getElementById(detailId) : null;

        if (filterVal === 'all' || category === filterVal) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
          if (detailRow) {
            detailRow.classList.remove('is-visible');
            detailRow.setAttribute('aria-hidden', 'true');
            row.classList.remove('is-expanded');
            row.querySelector('.row-expand-btn')?.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });
  });

  // 5. Video Placement: Modal Feature Controller
  const openModalBtn = document.getElementById('open-video-modal');
  const closeModalBtn = document.getElementById('close-video-modal');
  const dismissModalBtn = document.getElementById('dismiss-modal-btn');
  const modalDialog = document.getElementById('inspection-video-dialog');
  const modalVideo = document.getElementById('modal-hawser-video');

  const getFocusableModalElements = () => {
    if (!modalDialog) return [];
    return Array.from(
      modalDialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
  };

  const openVideoModal = () => {
    if (!modalDialog) return;
    modalDialog.style.display = 'block';
    if (typeof modalDialog.showModal === 'function') {
      try {
        modalDialog.showModal();
      } catch {
        modalDialog.setAttribute('open', '');
      }
    } else {
      modalDialog.setAttribute('open', '');
    }

    if (modalVideo && !prefersReducedMotion) {
      modalVideo.play().catch(() => {
        /* Autoplay policy fallback */
      });
    }

    // Set focus to close button
    if (closeModalBtn) {
      setTimeout(() => closeModalBtn.focus(), 50);
    }
  };

  const closeVideoModal = () => {
    if (!modalDialog) return;
    if (modalVideo) {
      modalVideo.pause();
    }
    if (typeof modalDialog.close === 'function') {
      try {
        modalDialog.close();
      } catch {
        /* Dialog might not be open */
      }
    }
    modalDialog.removeAttribute('open');
    modalDialog.style.display = 'none';

    // Return focus to trigger button
    if (openModalBtn) {
      openModalBtn.focus();
    }
  };

  if (openModalBtn) {
    openModalBtn.addEventListener('click', openVideoModal);
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeVideoModal);
  }

  if (dismissModalBtn) {
    dismissModalBtn.addEventListener('click', closeVideoModal);
  }

  if (modalDialog) {
    // Native cancel event on Escape
    modalDialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeVideoModal();
    });

    // Keydown trap inside dialog
    modalDialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeVideoModal();
        return;
      }

      if (e.key === 'Tab') {
        const focusables = getFocusableModalElements();
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !modalDialog.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !modalDialog.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });

    // Global listener while open as extra safeguard
    window.addEventListener('keydown', (e) => {
      const isModalOpen = modalDialog.open || modalDialog.hasAttribute('open');
      if (isModalOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeVideoModal();
        } else if (e.key === 'Tab') {
          if (!modalDialog.contains(document.activeElement)) {
            e.preventDefault();
            const focusables = getFocusableModalElements();
            if (focusables.length) focusables[0].focus();
          }
        }
      }
    });

    // Backdrop click to dismiss
    modalDialog.addEventListener('click', (e) => {
      const rect = modalDialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        closeVideoModal();
      }
    });

    modalDialog.addEventListener('close', () => {
      if (modalVideo) modalVideo.pause();
      modalDialog.style.display = 'none';
      if (openModalBtn) openModalBtn.focus();
    });
  }

  // 6. Dockside Dispatch Intake Form
  const intakeForm = document.getElementById('cable-intake-form');
  const statusMsg = document.getElementById('docket-status-message');
  if (intakeForm && statusMsg) {
    intakeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const vesselInput = document.getElementById('intake-vessel');
      const vesselName = vesselInput ? vesselInput.value.trim() : 'Installation';

      statusMsg.textContent = `✓ Calibration Docket for "${vesselName}" lodged at Victoria Dock. Berth Slipway 2 mobilised.`;
      statusMsg.style.color = 'var(--color-primary)';
      statusMsg.style.fontWeight = '700';

      intakeForm.reset();
      setTimeout(() => {
        statusMsg.textContent = '';
      }, 7000);
    });
  }

  // 7. Simulated Live F0 Telemetry Micro-Drift (for realistic atmosphere)
  const f0Display = document.getElementById('live-f0-val');
  if (f0Display && !prefersReducedMotion) {
    setInterval(() => {
      const baseFreq = 44.0;
      const jitter = (Math.random() * 0.04 - 0.02).toFixed(2);
      const current = (baseFreq + parseFloat(jitter)).toFixed(2);
      f0Display.textContent = `${current} Hz`;
    }, 2800);
  }
});
