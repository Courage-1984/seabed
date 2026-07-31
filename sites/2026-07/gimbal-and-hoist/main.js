import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Lazy-Load Fog Clearing Animation via IntersectionObserver
  const fogImages = document.querySelectorAll('.lazy-fog');
  if (fogImages.length > 0) {
    const imgObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fog-cleared');
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, threshold: 0.1 }
    );

    fogImages.forEach((img) => imgObserver.observe(img));
  }

  // 2. Charter Survey Request Wry Form Handler
  const charterForm = document.getElementById('charter-form');
  const feedbackBlock = document.getElementById('charter-feedback');

  if (charterForm && feedbackBlock) {
    charterForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const assetInput = document.getElementById('input-asset');
      const managerInput = document.getElementById('input-manager');

      const asset = assetInput ? assetInput.value.trim() : 'Specified Coastal Asset';
      const manager = managerInput ? managerInput.value.trim() : 'Operations Authority';

      feedbackBlock.innerHTML = `
        <strong>SURVEY TELEMETRY RECEIVED &middot; BRIDGE SAT-LINK CONVERGING</strong><br>
        Inquiry registered for <em>${asset}</em> under direction of ${manager}.<br>
        We have verified our North Sea tidal charts. If your structure has not crumbled into the swell before Q4, our Bridge Ops Officer will establish radio voice contact within 4 business hours to confirm grapnel ballistic clearance and zodiac docking protocol.
      `;
      feedbackBlock.className = 'form-feedback active';

      charterForm.reset();
      feedbackBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // 3. Smooth offset navigation for fixed header
  const navLinks = document.querySelectorAll('a[href^="#"]');
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
});
