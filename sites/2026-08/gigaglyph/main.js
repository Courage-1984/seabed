import './style.css';

// Boot Sequence Init
console.log('[SYS_INIT] Gigaglyph Cast Registry online.');
console.log('[SYS_INIT] Loading telemetry feeds...');

document.addEventListener('DOMContentLoaded', () => {
    // Telemetry scan lines logic for interactive hover rows
    const dataRows = document.querySelectorAll('.data-row');
    
    dataRows.forEach(row => {
        row.addEventListener('mouseenter', () => {
            row.classList.add('scan-active');
        });
        row.addEventListener('mouseleave', () => {
            row.classList.remove('scan-active');
        });
    });

    // Optional: blink elements with class 'cursor-blink'
    const cursors = document.querySelectorAll('.cursor-blink');
    setInterval(() => {
        cursors.forEach(c => {
            c.style.visibility = c.style.visibility === 'hidden' ? 'visible' : 'hidden';
        });
    }, 1000);
});
