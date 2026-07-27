import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Lithic Fibre Dynamics - Drone Routing Initialised.');
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Mock form submission
    const form = document.querySelector('.survey-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Survey Request Received';
            btn.style.backgroundColor = 'var(--color-primary)';
            btn.style.color = 'var(--color-white)';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
                btn.style.color = '';
                form.reset();
            }, 3000);
        });
    }
});
