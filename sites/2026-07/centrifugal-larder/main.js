import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Animate quantitative data counters upon intersection observation
  const statElements = document.querySelectorAll('[data-target]');
  
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const targetVal = parseFloat(el.getAttribute('data-target'));
        const suffix = el.getAttribute('data-suffix') || '';
        const prefix = el.getAttribute('data-prefix') || '';
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        const duration = 1600;
        const start = performance.now();
        
        const animate = (currentTime) => {
          const elapsed = currentTime - start;
          const progress = Math.min(elapsed / duration, 1);
          // Cubic ease out for scientific precision feel
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const currentVal = easeProgress * targetVal;
          
          let formattedVal;
          if (decimals > 0) {
            formattedVal = currentVal.toFixed(decimals);
          } else {
            formattedVal = Math.round(currentVal).toLocaleString('en-GB');
          }
          
          el.textContent = `${prefix}${formattedVal}${suffix}`;
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            let finalVal = decimals > 0 ? targetVal.toFixed(decimals) : Math.round(targetVal).toLocaleString('en-GB');
            el.textContent = `${prefix}${finalVal}${suffix}`;
          }
        };
        
        requestAnimationFrame(animate);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.25 });
  
  statElements.forEach(el => counterObserver.observe(el));

  // Animate percentage fill bars in the bento hardware grid
  const progressBars = document.querySelectorAll('.bento-progress-fill');
  const barObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const width = bar.getAttribute('data-width') || '100%';
        bar.style.width = width;
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.3 });
  
  progressBars.forEach(bar => barObserver.observe(bar));

  // Handle Trade Account Credentials intake form submission with dry clinical feedback
  const tradeForm = document.getElementById('trade-account-form');
  const formFeedback = document.getElementById('form-feedback-terminal');
  
  if (tradeForm && formFeedback) {
    tradeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = tradeForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      
      formFeedback.style.display = 'block';
      formFeedback.className = 'terminal-output active';
      formFeedback.innerHTML = `<p class="system-status"><span class="pulse-indicator"></span> Transmitting cryptographic audit payload to Milton Keynes cleanroom dispatch server...</p>`;
      
      setTimeout(() => {
        formFeedback.innerHTML = `
          <div class="feedback-success">
            <span class="status-badge">ACKNOWLEDGED // STATUS CODE 200-OK</span>
            <p><strong>Trade Credentials Logged into Technical Compliance Queue.</strong></p>
            <p>Verification of institutional license and VAT parameters will terminate within 24 operational hours. Approved brigades will receive secure API ordering tokens via diplomatic email routing.</p>
          </div>
        `;
        tradeForm.reset();
        if (submitBtn) submitBtn.disabled = false;
      }, 1400);
    });
  }

  // Handle sample request actions
  const sampleBtns = document.querySelectorAll('.js-request-sample');
  sampleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const intakeSection = document.getElementById('trade-account-intake');
      if (intakeSection) {
        intakeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const nameInput = document.getElementById('applicant-name');
        if (nameInput) nameInput.focus();
      }
    });
  });
});
