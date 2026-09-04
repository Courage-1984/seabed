import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    console.log("The Outer-Isles Kelp-Weave Guild Workshop Initialised.");
});

document.querySelectorAll('.hover-reveal-container').forEach(c => { const v = c.querySelector('video'); if (v) { c.addEventListener('mouseenter', () => v.play()); c.addEventListener('mouseleave', () => v.pause()); } });
