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
 * Signature effect — text scramble decode on reveal.
 * Characters cycle through a glyph set and settle into the final
 * string once, on first intersection. The markup already holds the
 * final text, so it reads correctly with no JS.
 * ------------------------------------------------------------------ */
const GLYPHS = '/\\|_-=+*^<>~:;.';

function scramble(el) {
  const finalText = el.dataset.scrambleText;
  const chars = [...finalText];
  const settleAt = chars.map((_, i) => Math.round(i * 1.4) + Math.floor(Math.random() * 8));
  const totalFrames = Math.max(...settleAt) + 8;
  let frame = 0;

  const tick = () => {
    let out = '';
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === ' ' || frame >= settleAt[i]) out += ch;
      else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    el.textContent = out;
    frame++;
    if (frame <= totalFrames) requestAnimationFrame(tick);
    else el.textContent = finalText;
  };
  requestAnimationFrame(tick);
}

function initScramble() {
  const targets = [...document.querySelectorAll('[data-scramble]')];
  if (!targets.length) return;
  targets.forEach((el) => {
    el.dataset.scrambleText = el.textContent.trim().replace(/\s+/g, ' ');
  });
  if (reduceMotion.matches || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        scramble(entry.target);
      });
    },
    { threshold: 0.5 }
  );
  targets.forEach((el) => observer.observe(el));
}

/* ------------------------------------------------------------------ *
 * Video placement — hero inset frame.
 * Pause the loop whenever the framed panel is off-screen.
 * ------------------------------------------------------------------ */
function initInsetVideo() {
  const video = document.querySelector('.hero-inset__video');
  if (!video) return;

  const apply = () => {
    if (reduceMotion.matches) video.pause();
    else video.play().catch(() => {});
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

/* ------------------------------------------------------------------ *
 * Supporting motion — the card-stack entry nearest the viewport centre
 * lifts, reinforcing the overlapping card-stack family.
 * ------------------------------------------------------------------ */
function initCardStack() {
  const cards = [...document.querySelectorAll('.card-stack-item')];
  if (!cards.length || reduceMotion.matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-current', e.isIntersecting)),
    { rootMargin: '-42% 0px -42% 0px' }
  );
  cards.forEach((c) => observer.observe(c));
}

document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  initScramble();
  initInsetVideo();
  initCardStack();
});
