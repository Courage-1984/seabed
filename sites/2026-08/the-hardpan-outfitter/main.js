import './style.css';

// Accent Slide Observer
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    // Apply observer to spec data rows
    const rows = document.querySelectorAll('.spec-data-row, .observe-slide');
    rows.forEach(row => {
        // Respect prefers-reduced-motion
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            observer.observe(row);
        } else {
            row.classList.add('in-view'); // instantly show
        }
    });

    // Technical Tab Switches
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const tabIndicator = document.querySelector('.tab-indicator');

    if(tabBtns.length > 0 && tabIndicator) {
        tabBtns.forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                // Remove active from all
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));

                // Add active to current
                btn.classList.add('active');
                
                const targetPanelId = btn.getAttribute('data-target');
                const targetPanel = document.getElementById(targetPanelId);
                if(targetPanel) {
                    targetPanel.classList.add('active');
                }

                // Move indicator
                tabIndicator.style.transform = `translateY(${idx * 100}%)`;
            });
        });
    }
});
