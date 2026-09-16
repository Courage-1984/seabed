import './style.css';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ------------------------------------------------------------------ *
 * Motion budget 1 — staggered scroll-reveal system.
 * Fires once per element, never re-triggers.
 * ------------------------------------------------------------------ */
function initReveals() {
  const targets = [...document.querySelectorAll('[data-reveal]')];
  if (!targets.length) return;

  // Only hide content once we know JS is running and can bring it back. If the
  // script fails to load the page renders un-animated instead of blank.
  document.documentElement.classList.add('js-reveal');

  const show = (el) => {
    if (el.classList.contains('is-revealed')) return;
    const group = el.parentElement;
    const siblings = group ? [...group.querySelectorAll('[data-reveal]')] : [el];
    const step = Math.max(0, siblings.indexOf(el));
    el.style.setProperty('--reveal-delay', `${step * 80}ms`);
    el.classList.add('is-revealed');
  };

  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    targets.forEach(show);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
  );

  targets.forEach((el) => observer.observe(el));

  // Backstop: the observer can miss elements that arrive in view through an
  // anchor jump or a programmatic scroll. Anything intersecting the viewport is
  // revealed regardless, so content can never be stranded invisible.
  const sweep = () => {
    for (const el of targets) {
      if (el.classList.contains('is-revealed')) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        show(el);
        observer.unobserve(el);
      }
    }
  };
  window.addEventListener('scroll', sweep, { passive: true });
  window.addEventListener('resize', sweep, { passive: true });
  window.addEventListener('hashchange', () => setTimeout(sweep, 600));
  setTimeout(sweep, 400);
}

/* ------------------------------------------------------------------ *
 * Signature effect — staggered letter-by-letter headline.
 * The heading is split into per-word/per-character spans that rise in
 * sequence. The original text stays in the DOM for assistive tech and
 * is fully readable if JS never runs.
 * ------------------------------------------------------------------ */
function splitHeadline(el) {
  const text = el.textContent.trim();
  const words = text.split(/\s+/);

  const frag = document.createDocumentFragment();
  let charIndex = 0;

  words.forEach((word, wordIndex) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'split-word';
    for (const char of word) {
      const charSpan = document.createElement('span');
      charSpan.className = 'split-char';
      charSpan.textContent = char;
      charSpan.style.setProperty('--char-index', String(charIndex++));
      wordSpan.appendChild(charSpan);
    }
    frag.appendChild(wordSpan);
    if (wordIndex < words.length - 1) frag.appendChild(document.createTextNode(' '));
  });

  // Keep the plain string available to screen readers; the spans are decorative.
  el.setAttribute('aria-label', text);
  el.textContent = '';
  el.appendChild(frag);
  el.classList.add('is-split');
}

function initSplitHeadline() {
  const heading = document.querySelector('[data-split-headline]');
  if (!heading) return;
  if (reduceMotion.matches) return; // leave the plain text exactly as authored

  splitHeadline(heading);

  if (!('IntersectionObserver' in window)) {
    heading.classList.add('is-animated');
    return;
  }
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      heading.classList.add('is-animated');
    },
    { threshold: 0.25 }
  );
  observer.observe(heading);
}

/* ------------------------------------------------------------------ *
 * Video placement — grid tile.
 * The loop only decodes while its bento cell is on screen.
 * ------------------------------------------------------------------ */
function initGridTileVideo() {
  const video = document.querySelector('.bento-video');
  if (!video) return;

  const apply = () => {
    if (reduceMotion.matches) {
      // Drop the attribute too, so the clip does not restart itself if the
      // element is re-attached or the source reloads.
      video.removeAttribute('autoplay');
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };
  reduceMotion.addEventListener('change', apply);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reduceMotion.matches) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.05 }
    );
    observer.observe(video);
  }
  apply();
}

document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initSplitHeadline();
  initGridTileVideo();
});
