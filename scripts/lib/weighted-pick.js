/**
 * Seeded, rotation-aware picking. Dependency-free so the registries
 * (video-placements.js, signature-effects.js) and rotation.js can all use it
 * without an import cycle.
 *
 * The old engine advanced a banned roll by +1 until it found a free value. That
 * linear probe collapses every banned cluster onto the same next value, which is
 * how three layout families reached 15 sites each while three others were never
 * used at all. pickRotated() replaces it: banned values are removed, and the rest
 * are drawn at random, weighted by how long ago each was last used.
 */

/** FNV-1a, 32-bit. */
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Small, well-mixed PRNG. Same seed, same sequence -- every roll is reproducible. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One independent stream per (date, dimension, nth) so dimensions never lock together. */
export function rngFor(date, dimension, nth = 1) {
  return mulberry32(hashString(`${date}|${dimension}|${nth}`));
}

/**
 * Pick one value from `pool`.
 *
 * @param {string[]} pool - every possible value, in canonical order
 * @param {Array<string|undefined>} recent - values of the most recent sites, newest first
 * @param {object} [opts]
 * @param {number} [opts.ban=0] - values used in the last `ban` sites are ineligible
 * @param {{ window: number, max: number }} [opts.cap] - ineligible once used `max` times in the last `window`
 * @param {Iterable<string>} [opts.allowed] - restrict the pool (e.g. placements compatible with a layout)
 * @param {Iterable<string>} [opts.exclude] - hard exclusions
 * @param {() => number} [opts.rng=Math.random]
 * @returns {{ value: string, fallback: boolean }} `fallback` is true when every candidate was banned
 *   and the least-recently-used one was returned instead
 */
export function pickRotated(pool, recent, opts = {}) {
  const { ban = 0, cap, allowed, exclude, rng = Math.random } = opts;
  const allowedSet = allowed ? new Set(allowed) : null;
  const excludeSet = new Set(exclude ?? []);
  const candidates = pool.filter((v) => (!allowedSet || allowedSet.has(v)) && !excludeSet.has(v));
  if (!candidates.length) throw new Error('pickRotated: no candidates left after allowed/exclude');

  const maxGap = 2 * pool.length;
  /** Sites since last use; 1 = the most recent site. Never used = maxGap. */
  const gapOf = (v) => {
    const i = recent.indexOf(v);
    return i === -1 ? maxGap : Math.min(i + 1, maxGap);
  };
  const isBanned = (v) => {
    if (recent.slice(0, ban).includes(v)) return true;
    if (cap && recent.slice(0, cap.window).filter((r) => r === v).length >= cap.max) return true;
    return false;
  };

  const eligible = candidates.filter((v) => !isBanned(v));
  if (!eligible.length) {
    const lru = candidates.slice().sort((a, b) => gapOf(b) - gapOf(a))[0];
    return { value: lru, fallback: true };
  }

  const weights = eligible.map((v) => gapOf(v) ** 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < eligible.length; i++) {
    r -= weights[i];
    if (r < 0) return { value: eligible[i], fallback: false };
  }
  return { value: eligible[eligible.length - 1], fallback: false };
}
