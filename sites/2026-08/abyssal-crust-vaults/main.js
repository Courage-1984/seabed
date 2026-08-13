import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    const blocks = document.querySelectorAll('.stacked-block');
    
    // Hard line-draw reveals
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.1 });

    blocks.forEach(block => {
        observer.observe(block);
    });
});
