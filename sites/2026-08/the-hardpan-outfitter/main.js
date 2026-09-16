import './style.css';

// Accent Slide Observer
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    // Apply observer to spec data rows
    const rows = document.querySelectorAll('.spec-data-row, .observe-slide');
    rows.forEach(row => {
        // Respect prefers-reduced-motion
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            observer.observe(row);
        } else {
            row.classList.add('in-view'); // instantly show
        }
    });

    // Technical Tab Switches
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const tabIndicator = document.querySelector('.tab-indicator');

    if(tabBtns.length > 0 && tabIndicator) {
        tabBtns.forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                // Remove active from all
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));

                // Add active to current
                btn.classList.add('active');
                
                const targetPanelId = btn.getAttribute('data-target');
                const targetPanel = document.getElementById(targetPanelId);
                if(targetPanel) {
                    targetPanel.classList.add('active');
                }

                // Move indicator
                tabIndicator.style.transform = `translateY(${idx * 100}%)`;
            });
        });
    }
});

/* ------------------------------------------------------------------ *
 * Video placement — section transition band.
 * The band wipes open as it rises through the viewport. The runway is
 * short so the wipe completes well before the band leaves the screen.
 * ------------------------------------------------------------------ */
function initTransitionBand() {
  const band = document.querySelector('[data-transition-band]');
  if (!band) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) {
    band.style.setProperty('--band-wipe', '100%');
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = band.getBoundingClientRect();
    const raw = (window.innerHeight - rect.top) / (window.innerHeight * 0.35);
    band.style.setProperty('--band-wipe', `${(Math.min(1, Math.max(0, raw)) * 100).toFixed(1)}%`);
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  // The loop only decodes while the band is on screen.
  const video = band.querySelector('[data-slot-video]');
  if (!video) return;
  const apply = () => {
    if (reduce.matches) {
      video.removeAttribute('autoplay');
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };
  reduce.addEventListener('change', apply);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reduce.matches) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.05 }
    ).observe(video);
  }
  apply();
}

document.addEventListener('DOMContentLoaded', initTransitionBand);
