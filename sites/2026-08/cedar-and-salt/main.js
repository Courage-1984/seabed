import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    // Sticky-rail sync logic
    const railLinks = document.querySelectorAll('.rail-link');
    const dossierBlocks = document.querySelectorAll('.dossier-block');

    if (railLinks.length > 0 && dossierBlocks.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    railLinks.forEach(link => link.classList.remove('active'));
                    const activeLink = document.querySelector(`.rail-link[href="#${entry.target.id}"]`);
                    if (activeLink) activeLink.classList.add('active');
                }
            });
        }, observerOptions);

        dossierBlocks.forEach(block => observer.observe(block));
    }
});
