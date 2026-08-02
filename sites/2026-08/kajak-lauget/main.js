import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                const navLinks = document.querySelectorAll('.sticky-index a');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, {
        rootMargin: '-30% 0px -70% 0px'
    });

    const blocks = document.querySelectorAll('.dossier-block');
    blocks.forEach(block => observer.observe(block));

    const accordions = document.querySelectorAll('.faq-item');
    accordions.forEach(acc => {
        const header = acc.querySelector('.faq-header');
        header.addEventListener('click', () => {
            acc.classList.toggle('active');
        });
    });
});
