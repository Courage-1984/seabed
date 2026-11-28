import './style.css';

/**
 * Rule & Trammel — main.js
 * Layout Family: layered-parallax
 * Style Family: riso spot-ink
 * Signature Effect: drifting grain overlay & numeric counter roll-up
 */

document.addEventListener('DOMContentLoaded', () => {
  initParallax();
  initScrollReveals();
  initCounters();
  initOrderSlip();
  initVideoController();
});

/**
 * Layered Parallax Engine
 * Updates translate3d for multi-plane depth elements on viewport scroll
 */
function initParallax() {
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  if (!parallaxElements.length) return;

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let isTicking = false;

  function updatePlanes() {
    // Disable on small devices (<768px) and when reduced motion is preferred
    if (window.innerWidth < 768 || reducedMotionQuery.matches) {
      parallaxElements.forEach((el) => {
        el.style.transform = '';
      });
      isTicking = false;
      return;
    }

    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    parallaxElements.forEach((el) => {
      const rate = parseFloat(el.getAttribute('data-parallax')) || 0;
      const rect = el.getBoundingClientRect();
      const elementTop = rect.top + scrollY;
      
      // Calculate relative offset from current scroll position
      const offset = (scrollY - elementTop) * rate;
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    });

    isTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!isTicking) {
      window.requestAnimationFrame(updatePlanes);
      isTicking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (!isTicking) {
      window.requestAnimationFrame(updatePlanes);
      isTicking = true;
    }
  }, { passive: true });

  // Initial pass
  updatePlanes();
}

/**
 * Scroll Reveal System
 * Staggered fade and slide using IntersectionObserver
 */
function initScrollReveals() {
  const revealCards = document.querySelectorAll('.reveal-card');
  if (!revealCards.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('is-revealed');
        }, idx * 60);
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  revealCards.forEach((card) => {
    observer.observe(card);
  });
}

/**
 * Counter Roll-Up (Supporting / Standards Metric Roll-up)
 * Counts up numbers from zero on intersection
 */
function initCounters() {
  const counterElements = document.querySelectorAll('[data-counter]');
  if (!counterElements.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const targetVal = parseFloat(el.getAttribute('data-counter'));
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        
        if (reducedMotion || isNaN(targetVal)) {
          el.textContent = decimals > 0 ? targetVal.toFixed(decimals) : targetVal.toString();
          obs.unobserve(el);
          return;
        }

        const duration = 1200; // ms
        const startTime = performance.now();

        function animate(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out expo
          const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const currentVal = easeProgress * targetVal;

          el.textContent = decimals > 0 ? currentVal.toFixed(decimals) : Math.floor(currentVal).toString();

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            el.textContent = decimals > 0 ? targetVal.toFixed(decimals) : targetVal.toString();
          }
        }

        requestAnimationFrame(animate);
        obs.unobserve(el);
      }
    });
  }, {
    threshold: 0.3
  });

  counterElements.forEach((el) => {
    observer.observe(el);
  });
}

/**
 * Interactive Bench Order Slip Drawer
 */
function initOrderSlip() {
  const toggleBtn = document.getElementById('orderSlipToggle');
  const closeBtn = document.getElementById('orderSlipClose');
  const drawer = document.getElementById('orderSlipDrawer');
  const emptyState = document.getElementById('orderSlipEmpty');
  const itemsList = document.getElementById('orderSlipItems');
  const summaryBlock = document.getElementById('orderSlipSummary');
  const tallyCount = document.getElementById('slipTallyCount');
  const subtotalVal = document.getElementById('slipSubtotal');
  const totalVal = document.getElementById('slipTotal');
  const clearBtn = document.getElementById('clearSlipBtn');
  const dispatchBtn = document.getElementById('dispatchSlipBtn');

  if (!toggleBtn || !drawer) return;

  const orderItems = [];

  function openDrawer() {
    drawer.hidden = false;
    drawer.classList.add('is-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    drawer.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  toggleBtn.addEventListener('click', () => {
    if (drawer.classList.contains('is-open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeDrawer);
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      closeDrawer();
      toggleBtn.focus();
    }
  });

  function renderSlip() {
    itemsList.innerHTML = '';
    const count = orderItems.length;
    tallyCount.textContent = count.toString();

    if (count === 0) {
      emptyState.hidden = false;
      summaryBlock.hidden = true;
      return;
    }

    emptyState.hidden = true;
    summaryBlock.hidden = false;

    let subtotal = 0;

    orderItems.forEach((item, index) => {
      subtotal += item.price;
      const li = document.createElement('li');
      li.className = 'slip-item';
      li.innerHTML = `
        <div class="slip-item-header">
          <span class="slip-item-title">${escapeHtml(item.name)}</span>
          <span class="slip-item-price">£${item.price}</span>
        </div>
        <div class="slip-item-grad">${escapeHtml(item.graduation)}</div>
        <button type="button" class="slip-item-remove" data-index="${index}" aria-label="Remove ${escapeHtml(item.name)}">Remove</button>
      `;
      itemsList.appendChild(li);
    });

    subtotalVal.textContent = `£${subtotal}`;
    totalVal.textContent = `£${subtotal}`;

    // Attach remove listeners
    const removeBtns = itemsList.querySelectorAll('.slip-item-remove');
    removeBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        orderItems.splice(idx, 1);
        renderSlip();
      });
    });
  }

  // Handle Add to Order Slip buttons
  const addButtons = document.querySelectorAll('.btn-add-slip');
  addButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name');
      const price = parseFloat(btn.getAttribute('data-price')) || 0;
      const selectorId = btn.getAttribute('data-selector');
      const selectorEl = document.getElementById(selectorId);
      const graduation = selectorEl ? selectorEl.value : 'Standard Bench Division';

      orderItems.push({ name, price, graduation });
      renderSlip();
      openDrawer();
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      orderItems.length = 0;
      renderSlip();
    });
  }

  if (dispatchBtn) {
    dispatchBtn.addEventListener('click', () => {
      dispatchBtn.textContent = 'Bench Order Logged ✓';
      dispatchBtn.style.backgroundColor = '#16264C';
      setTimeout(() => {
        dispatchBtn.textContent = 'Confirm Bench Dispatch';
        dispatchBtn.style.backgroundColor = '';
        closeDrawer();
      }, 1600);
    });
  }
}

/**
 * Ambient Video Controller
 * Ensures video plays when in viewport and pauses when off-screen
 */
function initVideoController() {
  const footerVideo = document.getElementById('footerVideo');
  const footer = document.getElementById('footer-contact');
  if (!footerVideo || !footer) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    footerVideo.pause();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        footerVideo.play().catch(() => {
          // Autoplay policy prevented playback; poster fallback remains visible
        });
      } else {
        footerVideo.pause();
      }
    });
  }, {
    threshold: 0.1
  });

  observer.observe(footer);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
