import './style.css';

window.addEventListener('scroll', () => {
  document.body.style.setProperty('--scroll-y', `${window.scrollY}px`);
});
