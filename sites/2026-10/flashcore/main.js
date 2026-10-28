import './style.css';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 1. Signature effect: numeric counter roll-up (fires once on intersection, tabular-nums prevents layout jitter)
const counters = document.querySelectorAll('.counter');
if (counters.length && !reduceMotion) {
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.target);
    if (Number.isNaN(target)) return;
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const useComma = el.dataset.format === 'comma' || target >= 1000;
    const duration = 1200;
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic-bezier ease-out
      const current = ease * target;

      let formatted;
      if (decimals > 0) {
        formatted = current.toFixed(decimals);
      } else if (useComma) {
        formatted = Math.round(current).toLocaleString('en-GB');
      } else {
        formatted = Math.round(current).toString();
      }

      el.textContent = `${prefix}${formatted}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        let finalFormatted;
        if (decimals > 0) {
          finalFormatted = target.toFixed(decimals);
        } else if (useComma) {
          finalFormatted = target.toLocaleString('en-GB');
        } else {
          finalFormatted = target.toString();
        }
        el.textContent = `${prefix}${finalFormatted}${suffix}`;
      }
    };

    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    counters.forEach((c) => counterObserver.observe(c));
  } else {
    counters.forEach(animateCounter);
  }
}

// 2. Scroll-reveal system: staggered via --i, fires once, never re-triggers
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver(
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
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-in'));
}

// 3. Header shadow snaps in past 50px
const header = document.getElementById('site-header');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 50);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// 4. Inline process demo: starts paused on its poster, plays on click or when in view
const media = document.querySelector('.player-media');
const video = media && media.querySelector('video');
if (video) {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'btn btn-primary player-toggle';
  const sync = () => {
    toggle.textContent = video.paused ? 'Play extraction' : 'Pause extraction';
  };
  toggle.addEventListener('click', () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  });
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  sync();
  media.append(toggle);

  if (reduceMotion) {
    video.pause();
  } else if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        });
      },
      { threshold: 0.4 }
    ).observe(video);
  }
}

// 5. Specimen request form: acknowledge on-page (static site, no backend)
const form = document.getElementById('specimen-form');
const status = document.getElementById('form-status');
if (form && status) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const type = form.elements.type.selectedOptions[0].textContent;
    status.textContent = `Application logged for: ${type}. The curator will reply within five working days.`;
    form.reset();
  });
}
