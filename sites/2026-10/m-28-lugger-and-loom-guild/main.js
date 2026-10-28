import './style.css';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

// 1. Scroll-reveal system: staggered via --i, fires once, never re-triggers
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduceMotion) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-in'));
}

// 2. Nav bar elevation past 50px
const header = document.getElementById('site-header');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 50);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// 3. Signature effect: CSS 3D card tilt toward the pointer (fine pointers only)
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.tilt').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      const rect = card.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      card.style.setProperty('--tx', Math.max(-1, Math.min(1, nx)).toFixed(3));
      card.style.setProperty('--ty', Math.max(-1, Math.min(1, ny)).toFixed(3));
      card.classList.add('is-tilting');
    });
    const reset = () => {
      card.classList.remove('is-tilting');
      card.style.setProperty('--tx', 0);
      card.style.setProperty('--ty', 0);
    };
    card.addEventListener('pointerleave', reset);
    card.addEventListener('blur', reset);
  });
}

// 4. Hero inset frame video: plays only while in view, never under reduced motion
const insetVideo = document.querySelector('.inset-media video');
if (insetVideo) {
  if (reduceMotion || !('IntersectionObserver' in window)) {
    insetVideo.pause();
  } else {
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            insetVideo.play().catch(() => {});
          } else {
            insetVideo.pause();
          }
        });
      },
      { threshold: 0.25 }
    ).observe(insetVideo);
  }
}

// 5. Cargo manifest form: acknowledge on-page (static site, no backend)
const form = document.getElementById('cargo-manifest-form');
const status = document.getElementById('form-status');
if (form && status) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const port = form.elements.port.selectedOptions[0].textContent;
    status.textContent = `Manifest logged at the Newlyn slipway for lading at ${port}. The supercargo will answer within three working days.`;
    form.reset();
  });
}
