import './style.css';

document.querySelectorAll('.hover-reveal-container').forEach(c => { const v = c.querySelector('video'); if (v) { c.addEventListener('mouseenter', () => v.play()); c.addEventListener('mouseleave', () => v.pause()); } });
