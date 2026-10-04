/**
 * Hub ordering: an equal, seeded-random rotation through style families, so that
 * neighbouring cards never share a style family whenever that is possible at all.
 *
 * Pure and dependency-light on purpose: hub.js (browser, bundled by Vite) imports
 * it, and Node can test it against the real archive.
 *
 * Each round visits every family that still has sites, in a fresh random order,
 * taking that family's next site (input order is kept within a family, so pass
 * the list newest-first). Families are not equal in size -- most of the archive
 * predates the style families and shares one look -- so a family that would
 * otherwise be left piling up at the end takes extra turns early, never next to
 * itself. The result: no two neighbours share a family unless one family is more
 * than half of the list, in which case the repeats are spread as thinly as possible.
 */
import { mulberry32, hashString } from './weighted-pick.js';

const UNCLASSIFIED = '(unclassified)';

/**
 * @template T
 * @param {T[]} items - newest first
 * @param {object} [opts]
 * @param {(item: T) => string | null | undefined} [opts.groupOf] - defaults to item.styleFamily
 * @param {string} [opts.seed] - same seed, same order
 * @returns {T[]}
 */
export function interleaveByStyle(items, { groupOf = (it) => it.styleFamily, seed = '' } = {}) {
  const buckets = new Map();
  for (const item of items) {
    const g = groupOf(item) || UNCLASSIFIED;
    if (!buckets.has(g)) buckets.set(g, []);
    buckets.get(g).push(item);
  }

  const rng = mulberry32(hashString(String(seed)));
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const out = [];
  let prev = null;
  let round = [];

  /** After placing `g`, can the rest still avoid same-family neighbours (the next one must differ from g)? */
  const stillPossibleAfter = (g) => {
    const left = items.length - out.length - 1;
    for (const [k, bucket] of buckets) {
      const n = bucket.length - (k === g ? 1 : 0);
      if (n > (k === g ? Math.floor(left / 2) : Math.ceil(left / 2))) return false;
    }
    return true;
  };
  const canGo = (g) => g !== prev && buckets.has(g) && stillPossibleAfter(g);

  while (out.length < items.length) {
    round = round.filter((g) => buckets.has(g));
    if (!round.length) round = shuffle([...buckets.keys()]);

    let g = round.find(canGo);
    if (g === undefined) {
      // Nobody left in this round can go next without stranding a big family later:
      // the biggest family that can go takes an extra turn.
      const ranked = [...buckets.keys()]
        .filter((k) => k !== prev)
        .sort((a, b) => buckets.get(b).length - buckets.get(a).length);
      g = ranked.find(canGo) ?? ranked[0] ?? prev;
    }

    const i = round.indexOf(g);
    if (i !== -1) round.splice(i, 1);
    out.push(buckets.get(g).shift());
    if (!buckets.get(g).length) buckets.delete(g);
    prev = g;
  }
  return out;
}

/** Longest run of neighbours sharing a family -- 1 means no two neighbours match. */
export function longestStyleRun(items, groupOf = (it) => it.styleFamily) {
  let longest = items.length ? 1 : 0;
  let run = 1;
  for (let i = 1; i < items.length; i++) {
    run = (groupOf(items[i]) || UNCLASSIFIED) === (groupOf(items[i - 1]) || UNCLASSIFIED) ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
}
