/**
 * Binds a QA verdict to the bytes it was produced from.
 *
 * imperivm-spqr shipped green on a qa-report.json generated at 20:10 against a
 * dist/ that was rebuilt at 20:16, with index.html changed again at 20:14. The
 * report was describing a build that no longer existed and nothing noticed.
 *
 * A report now records the digest of the site source it tested; check:ship
 * recomputes it and fails `qa-report-stale` on a mismatch. The same digest
 * binds an agent's visual review to the screenshots and the source it
 * reviewed, so a review cannot outlive the thing it approved.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Files whose contents change what a page renders. */
const CONTENT_EXT = /\.(html|css|js|mjs|json)$/i;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/**
 * SHA-256 over a site folder: full contents of every html/css/js/json file,
 * and name + size for every asset. Asset bytes are hashed by size rather than
 * content because a 2.5 MB video per site makes a content hash cost more than
 * the check is worth — a re-encode changes the size, and a same-size swap of
 * identical dimensions is not a case worth paying for on every gate run.
 */
export function siteSourceDigest(siteAbsolutePath) {
  const hash = createHash('sha256');
  for (const file of walk(siteAbsolutePath)) {
    const rel = relative(siteAbsolutePath, file).replace(/\\/g, '/');
    if (CONTENT_EXT.test(rel)) {
      hash.update(`${rel}\0`);
      // Normalise line endings before hashing. On Windows with autocrlf a
      // checkout, stash or clone rewrites every text file from LF to CRLF,
      // which changes the bytes without changing a single rendered pixel.
      // Without this, routine git operations invalidate a visual review that
      // is still perfectly accurate.
      hash.update(readFileSync(file, 'utf8').replace(/\r\n/g, '\n'));
      hash.update('\0');
    } else {
      hash.update(`${rel}\0${statSync(file).size}\0`);
    }
  }
  return hash.digest('hex');
}

/**
 * Digest of the built output actually served to the browser. dist/ is what
 * `npm run qa` tests, so a stale dist is just as wrong as stale source.
 * Returns null when dist/ is absent — the caller decides whether that matters.
 */
export function distDigest(root) {
  const dist = join(root, 'dist');
  if (!existsSync(dist)) return null;
  const hash = createHash('sha256');
  for (const file of walk(dist)) {
    const rel = relative(dist, file).replace(/\\/g, '/');
    hash.update(`${rel}\0${statSync(file).size}\0`);
  }
  return hash.digest('hex');
}

/** Short form for logs and front-matter. Full digests are stored in the JSON. */
export function shortDigest(digest) {
  return digest ? digest.slice(0, 12) : null;
}
