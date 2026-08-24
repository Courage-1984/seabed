import './style.css';

// Requisition form handling
document.querySelector('.requisition-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  const originalText = btn.textContent;
  btn.textContent = 'REQUISITION SUBMITTED';
  btn.style.background = 'var(--color-primary)';
  btn.style.color = 'var(--color-bg)';
  
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
    btn.style.color = '';
    e.target.reset();
  }, 3000);
});
