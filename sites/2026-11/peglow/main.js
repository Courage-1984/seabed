import './style.css';

/**
 * PegLow Brand Site Engine
 * Swiss International layout, Asymmetric Split dynamics, Magnetic proximity cursor, and accessible interactive modules.
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveals();
  initMagneticCursor();
  initAsymmetricScrollMotion();
  initVideoPlayer();
  initSpecToggle();
  initSwatchForm();
  initMobileNav();
});

/**
 * 1. IntersectionObserver Scroll-Reveal System
 * Staggered reveals with transform & opacity only; fires once.
 */
function initScrollReveals() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal-init').forEach(el => el.classList.add('reveal-visible'));
    return;
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.15,
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const siblings = Array.from(target.parentElement.querySelectorAll('.reveal-init'));
        const index = siblings.indexOf(target);
        const stagger = index >= 0 ? index * 70 : 0;

        setTimeout(() => {
          target.classList.add('reveal-visible');
        }, stagger);

        observer.unobserve(target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal-init').forEach(el => revealObserver.observe(el));
}

/**
 * 2. Signature Effect: Magnetic Proximity Cursor Element
 * Translates target element toward pointer within 90px radius (<= 8px travel), pointer-fine only.
 */
function initMagneticCursor() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const magneticTargets = document.querySelectorAll('.js-magnetic');
  if (!magneticTargets.length) return;

  const RADIUS = 90;
  const MAX_TRAVEL = 8;

  magneticTargets.forEach(target => {
    let ticking = false;

    const handlePointerMove = (e) => {
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.hypot(distX, distY);

      if (distance < RADIUS) {
        const factor = (1 - distance / RADIUS);
        const travelX = (distX / distance) * MAX_TRAVEL * factor;
        const travelY = (distY / distance) * MAX_TRAVEL * factor;

        if (!ticking) {
          requestAnimationFrame(() => {
            target.style.transform = `translate3d(${travelX.toFixed(2)}px, ${travelY.toFixed(2)}px, 0)`;
            ticking = false;
          });
          ticking = true;
        }
      } else {
        target.style.transform = 'translate3d(0, 0, 0)';
      }
    };

    const handlePointerLeave = () => {
      target.style.transform = 'translate3d(0, 0, 0)';
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);
  });
}

/**
 * 3. Layout Family Signature Motion: Asymmetric Split Parallax
 * Counter-translates grid-breaking numeral and bleeding image +-12px relative to scroll.
 */
function initAsymmetricScrollMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const flagship = document.querySelector('.flagship-section');
  if (!flagship) return;

  const numeral = flagship.querySelector('.grid-break-numeral');
  const bleedMedia = flagship.querySelector('.split-bleed-media');
  if (!numeral && !bleedMedia) return;

  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const rect = flagship.getBoundingClientRect();
      const winH = window.innerHeight;

      if (rect.top < winH && rect.bottom > 0) {
        const progress = (winH - rect.top) / (winH + rect.height);
        const offsetNumeral = (progress - 0.5) * -18; // +-9px counter-translation
        const offsetBleed = (progress - 0.5) * 16;   // +-8px drift

        if (numeral) {
          numeral.style.transform = `translate3d(0, ${offsetNumeral.toFixed(1)}px, 0)`;
        }
        if (bleedMedia && window.innerWidth >= 928) {
          bleedMedia.style.transform = `translate3d(0, ${offsetBleed.toFixed(1)}px, 0)`;
        }
      }
      ticking = false;
    });
    ticking = true;
  };

  window.addEventListener('scroll', onScroll, { passive: true });
}

/**
 * 4. Video Player & Scroll Playback Controller
 * Autoplays muted loop when in view, pauses when out of view, with manual toggle.
 */
function initVideoPlayer() {
  const video = document.querySelector('.js-process-video');
  const toggleBtn = document.querySelector('.js-video-toggle');
  if (!video) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.pause();
    if (toggleBtn) {
      toggleBtn.innerHTML = `<span>▶</span> Play Demo`;
      toggleBtn.setAttribute('aria-pressed', 'false');
    }
    return;
  }

  // Observer to pause when off-screen
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.25 });

  videoObserver.observe(video);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play().then(() => {
          toggleBtn.innerHTML = `<span>❚❚</span> Pause Demo`;
          toggleBtn.setAttribute('aria-pressed', 'true');
        }).catch(() => {});
      } else {
        video.pause();
        toggleBtn.innerHTML = `<span>▶</span> Play Demo`;
        toggleBtn.setAttribute('aria-pressed', 'false');
      }
    });
  }
}

/**
 * 5. Fabric Weight Toggle (hides.html)
 * Updates matrix table cells dynamically between 180 gsm and 210 gsm.
 */
function initSpecToggle() {
  const toggleBtns = document.querySelectorAll('.js-weight-toggle');
  if (!toggleBtns.length) return;

  const data180 = {
    hideWeight: '890 g',
    hidePack: '38 × 11 cm',
    hidePrice: '£245',
    hideHead: '8,000 mm',
    canopyWeight: '520 g',
    canopyPack: '24 × 9 cm',
    canopyPrice: '£165',
    canopyHead: '8,000 mm',
    kneelerWeight: '310 g',
    kneelerPack: '36 × 26 × 3 cm',
    kneelerPrice: '£48',
    kneelerHead: '10,000 mm',
  };

  const data210 = {
    hideWeight: '1,040 g',
    hidePack: '40 × 12 cm',
    hidePrice: '£275',
    hideHead: '9,500 mm',
    canopyWeight: '610 g',
    canopyPack: '26 × 10 cm',
    canopyPrice: '£185',
    canopyHead: '9,500 mm',
    kneelerWeight: '350 g',
    kneelerPack: '36 × 26 × 3 cm',
    kneelerPrice: '£54',
    kneelerHead: '12,000 mm',
  };

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const weight = btn.dataset.weight;
      const dataset = weight === '210' ? data210 : data180;

      Object.keys(dataset).forEach(key => {
        const cell = document.querySelector(`[data-spec="${key}"]`);
        if (cell) {
          cell.textContent = dataset[key];
        }
      });
    });
  });
}

/**
 * 6. Swatch Request Form (field-notes.html)
 * Validates, renders inline receipt with unique ref, prevents full page reload.
 */
function initSwatchForm() {
  const form = document.getElementById('swatch-request-form');
  const receipt = document.getElementById('swatch-receipt');
  if (!form || !receipt) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('observer-name').value.trim();
    const pursuit = document.getElementById('observer-pursuit').value;
    const address = document.getElementById('observer-address').value.trim();

    if (!name || !address) return;

    const randomRef = 'PL-SWATCH-' + Math.floor(1000 + Math.random() * 9000);
    const receiptRef = receipt.querySelector('.receipt-ref');
    const receiptSummary = receipt.querySelector('.receipt-summary');

    if (receiptRef) receiptRef.textContent = randomRef;
    if (receiptSummary) {
      receiptSummary.textContent = `Swatch parcel logged for ${name} (${pursuit}). Despatch envelope will be posted via Royal Mail First Class from Wells-next-the-Sea within 24 hours.`;
    }

    form.reset();
    receipt.classList.add('visible');
    receipt.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

/**
 * 7. Mobile Navigation Toggle
 */
function initMobileNav() {
  const toggle = document.querySelector('.mobile-nav-toggle');
  const menu = document.querySelector('.mobile-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}
