import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Mobile Navigation Toggle
  const navToggle = document.querySelector('.mobile-nav-toggle');
  const navList = document.querySelector('.nav-list');

  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navList.classList.contains('is-open')) {
        navList.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  // 2. IntersectionObserver Scroll Reveal System
  const revealBlocks = document.querySelectorAll('.reveal-block');
  if (revealBlocks.length > 0 && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1
    });

    revealBlocks.forEach(block => revealObserver.observe(block));
  } else {
    // If reduced motion or no observer, ensure all are immediately visible
    revealBlocks.forEach(block => block.classList.add('is-revealed'));
  }

  // 3. Signature Effect: Staggered Letter-by-Letter Headline
  const staggerHeadlines = document.querySelectorAll('.headline-stagger');
  staggerHeadlines.forEach(headline => {
    if (prefersReducedMotion) return;

    const originalText = headline.textContent.trim();
    if (!originalText) return;

    // Preserve original accessible label
    headline.setAttribute('aria-label', originalText);
    headline.textContent = '';

    const words = originalText.split(/\s+/);
    let letterIndex = 0;

    words.forEach((word, wIdx) => {
      const wordSpan = document.createElement('span');
      wordSpan.style.display = 'inline-block';
      wordSpan.style.whiteSpace = 'nowrap';
      wordSpan.setAttribute('aria-hidden', 'true');

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const charSpan = document.createElement('span');
        charSpan.className = 'letter-span';
        charSpan.textContent = char;
        charSpan.style.animationDelay = `${letterIndex * 28}ms`;
        wordSpan.appendChild(charSpan);
        letterIndex++;
      }

      headline.appendChild(wordSpan);

      // Add space between words
      if (wIdx < words.length - 1) {
        const spaceSpan = document.createElement('span');
        spaceSpan.innerHTML = '&nbsp;';
        spaceSpan.setAttribute('aria-hidden', 'true');
        headline.appendChild(spaceSpan);
      }
    });
  });

  // 4. Video Viewport Observer (pause when out of view, respect reduced-motion)
  const videos = document.querySelectorAll('video');
  if (videos.length > 0) {
    if (prefersReducedMotion) {
      videos.forEach(v => {
        try { v.pause(); } catch (e) {}
      });
    } else {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.25 });

      videos.forEach(v => videoObserver.observe(v));
    }
  }
});
