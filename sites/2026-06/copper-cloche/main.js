import './style.css';

document.addEventListener('DOMContentLoaded', () => {
    const depthGauge = document.getElementById('depth-gauge');
    if (!depthGauge) return;
    
    // Depth ranges from 0m to 60m based on scroll percentage
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight;
        const winHeight = window.innerHeight;
        const scrollPercent = scrollTop / (docHeight - winHeight);
        
        let depth = Math.min(60, Math.max(0, scrollPercent * 60));
        depthGauge.textContent = `Depth: ${depth.toFixed(1)}m`;
    });
});
