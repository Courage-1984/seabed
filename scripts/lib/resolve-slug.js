import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';

/**
 * Recursively scans under the 'sites' directory for any folder containing a meta.json file.
 * @param {string} root - The project root directory.
 * @returns {Array<{ absolutePath: string, relativePath: string, slug: string, bucket: string }>}
 */
export function findAllSiteDirs(root) {
  const sitesDir = join(root, 'sites');
  if (!existsSync(sitesDir)) return [];

  const results = [];

  function scan(currentDir) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      const fullPath = join(currentDir, entry.name);
      const metaPath = join(fullPath, 'meta.json');

      if (existsSync(metaPath)) {
        const relPath = relative(root, fullPath).replace(/\\/g, '/');
        const slug = basename(fullPath);
        const parentDir = dirname(fullPath);
        const bucket = parentDir === sitesDir ? '' : basename(parentDir);

        results.push({
          absolutePath: fullPath,
          relativePath: relPath,
          slug,
          bucket
        });
      } else {
        // If meta.json doesn't exist here, recurse into subdirectories (e.g. year-month buckets)
        scan(fullPath);
      }
    }
  }

  scan(sitesDir);
  // Sort alphabetically by relative path for deterministic results
  results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return results;
}

/**
 * Resolves a site by simple slug (e.g. 'gimbal-and-hoist') or path-like string across subdirectories.
 * @param {string} root - The project root directory.
 * @param {string} target - The site slug or relative path to look up.
 * @returns {{ absolutePath: string, relativePath: string, slug: string, bucket: string } | null}
 */
export function resolveSlugPath(root, target) {
  if (!target) return null;
  const normalizedTarget = target.replace(/\\/g, '/').replace(/^sites\//, '').replace(/\/$/, '');
  const allSites = findAllSiteDirs(root);

  // First try matching simple slug name exactly
  let match = allSites.find(s => s.slug === normalizedTarget);
  if (match) return match;

  // Next try matching against the full relative path (e.g. 2026-07/gimbal-and-hoist)
  match = allSites.find(s => s.relativePath === `sites/${normalizedTarget}` || s.relativePath.endsWith(`/${normalizedTarget}`));
  return match || null;
}
