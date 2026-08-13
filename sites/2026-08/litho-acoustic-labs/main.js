import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    // Laser Beam Line Draw Motion
    const sections = document.querySelectorAll('.section-title');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, {
        threshold: 0.1
    });

    sections.forEach(section => {
        observer.observe(section);
    });
});
