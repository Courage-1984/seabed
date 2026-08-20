import './style.css';

// Intersection Observer for the split-screen scroll mechanic
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.scroll-section');
    const telemetryDisplay = document.querySelector('.telemetry-display');

    if (!telemetryDisplay || sections.length === 0) return;

    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px', // Trigger when section hits middle of viewport
        threshold: 0
    };

    const sectionStateMap = {
        'hardware-registry': 'telemetry-hardware',
        'protocol-architecture': 'telemetry-protocol',
        'transmission-matrix': 'telemetry-matrix',
        'fleet-tiers': 'telemetry-fleet'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                const stateClass = sectionStateMap[sectionId];
                
                // Clear all state classes
                Object.values(sectionStateMap).forEach(cls => {
                    telemetryDisplay.classList.remove(cls);
                });

                if (stateClass) {
                    telemetryDisplay.classList.add(stateClass);
                    updateTelemetryText(sectionId);
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    function updateTelemetryText(sectionId) {
        const statusEl = document.querySelector('.telemetry-status-text');
        const depthEl = document.querySelector('.telemetry-depth-text');
        if (!statusEl || !depthEl) return;

        switch (sectionId) {
            case 'hardware-registry':
                statusEl.textContent = 'STATUS: SCANNING HARDWARE NODES';
                depthEl.textContent = 'DEPTH: 3,000 M';
                break;
            case 'protocol-architecture':
                statusEl.textContent = 'STATUS: ACQUIRING PACKET PIPELINE';
                depthEl.textContent = 'BAND: 16-22 kHz';
                break;
            case 'transmission-matrix':
                statusEl.textContent = 'STATUS: COMPARING TRANSMISSION METRICS';
                depthEl.textContent = 'ERROR RATE: 0.001%';
                break;
            case 'fleet-tiers':
                statusEl.textContent = 'STATUS: INITIALISING DEPLOYMENT GRID';
                depthEl.textContent = 'NODES ACTIVE: 24';
                break;
        }
    }
});
