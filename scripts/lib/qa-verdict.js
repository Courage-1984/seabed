/**
 * The single definition of "this page has QA issues".
 *
 * qa_sweep.js and ship-gate.js each used to carry their own copy, and they had
 * drifted: the gate's version omitted missingFavicon, smallFonts,
 * overlappingText and repetitiveLayout, so a page could fail `npm run qa` and
 * still pass `npm run check:ship`. Both now import from here.
 */

/**
 * Per-view issue keys. `path` is where the count lands in summary.counts;
 * `get` pulls the value out of a view object.
 */
export const ISSUE_KEYS = [
  { count: 'overflow', get: (v) => v.overflowingElements },
  { count: 'brokenImages', get: (v) => v.brokenImages },
  { count: 'nonWebpPhotos', get: (v) => v.nonWebpPhotos },
  { count: 'missingAltTags', get: (v) => v.missingAltTags },
  { count: 'missingFavicon', get: (v) => v.missingFavicon },
  { count: 'consoleErrors', get: (v) => v.consoleErrors },
  { count: 'pageErrors', get: (v) => v.pageErrors },
  { count: 'networkErrors', get: (v) => v.networkErrors },
  { count: 'brokenLinks', get: (v) => v.brokenLinks },
  { count: 'smallFonts', get: (v) => v.visualIssues?.smallFonts },
  { count: 'overlappingText', get: (v) => v.visualIssues?.overlappingText },
  { count: 'videoIssues', get: (v) => v.videoIssues },
];

/**
 * Views of a page result. Reports written by the current sweep carry `views`
 * keyed by device; older reports on disk carry `mobile`/`desktop`. Accepting
 * both means an upgrade does not silently misread a stale report as clean.
 */
export function viewsOf(pageResult) {
  if (!pageResult) return [];
  if (pageResult.views && typeof pageResult.views === 'object') {
    return Object.entries(pageResult.views).map(([key, view]) => ({ key, view }));
  }
  return [
    { key: 'mobile', view: pageResult.mobile },
    { key: 'desktop', view: pageResult.desktop },
  ].filter((v) => v.view);
}

export function viewHasIssues(view) {
  if (!view) return false;
  if (ISSUE_KEYS.some(({ get }) => get(view)?.length)) return true;
  return Boolean(view.visualIssues?.repetitiveLayout);
}

/** Which issue keys fired, for a readable failure line. */
export function viewIssueSummary(view) {
  if (!view) return [];
  const hits = ISSUE_KEYS.filter(({ get }) => get(view)?.length).map(
    ({ count, get }) => `${count}:${get(view).length}`
  );
  if (view.visualIssues?.repetitiveLayout) hits.push('repetitiveLayout');
  return hits;
}

export function pageFailed(pageResult) {
  if (!pageResult) return false;
  if (pageResult.error) return true;
  return viewsOf(pageResult).some(({ view }) => viewHasIssues(view));
}

/** Device keys on a page result that have at least one issue. */
export function failingDevices(pageResult) {
  return viewsOf(pageResult)
    .filter(({ view }) => viewHasIssues(view))
    .map(({ key }) => key);
}

export function accumulateCounts(pagesList) {
  const counts = Object.fromEntries(ISSUE_KEYS.map(({ count }) => [count, 0]));
  counts.repetitiveLayouts = 0;
  for (const pageResult of pagesList) {
    for (const { view } of viewsOf(pageResult)) {
      if (!view) continue;
      for (const { count, get } of ISSUE_KEYS) counts[count] += get(view)?.length || 0;
      if (view.visualIssues?.repetitiveLayout) counts.repetitiveLayouts++;
    }
  }
  return counts;
}

/**
 * Severity for the visual-QA findings produced by visual_qa.js.
 *
 * These checks were written in round 1 and gated nothing: visual_qa.js exited 0
 * whatever it found and ship-gate.js never opened qa-visual-report.json, so a
 * site could report hundreds of findings and still reach SHIP_PASS because the
 * agent wrote "verdict: PASS" about itself. A blocker now fails the run.
 *
 * Blockers are defects that break layout, legibility or access. Advisory
 * findings are real but judgement-dependent -- they belong in the review file,
 * not in an automatic refusal.
 */
export const VISUAL_BLOCKERS = new Set([
  'intrinsicOverflow',
  'horizontalScrollCulprits',
  'clippedByOverflowHidden',
  'uncollapsibleTrack',
  'unbreakableText',
  'iosZoomInputs',
  'unlabelledField',
  'clippedPlaceholder',
  'viewportMeta',
  'modalScrollLock',
  'lowContrastText',
  'textOverMediaNoScrim',
  'horizontalScroll',
  'revealStuckHidden',
  'unnamedControl',
  'modalIssues',
]);

/** Findings worth reporting but not worth refusing a build over. */
export const VISUAL_ADVISORY = new Set([
  'tightLineHeight',
  'smallTapTargets',
  'tapTargetSpacing',
  'viewportHeightClipping',
  'viewportUnitRisk',
  'directionalScrim',
  'hoverOnlyAffordance',
  'safeAreaInset',
  'stickyHeaderNoScrollPadding',
  'missingLandmark',
  'invisibleFocus',
  'focusOffscreen',
  'modalNotDriven',
]);

/** `[{ key, count }]` for the blocker-class findings in one device's result. */
export function blockersIn(findings) {
  if (!findings) return [];
  const hits = [];
  for (const [key, value] of Object.entries(findings)) {
    if (key === 'truncated' || !VISUAL_BLOCKERS.has(key)) continue;
    const count = Array.isArray(value) ? value.length : value ? 1 : 0;
    if (count) hits.push({ key, count });
  }
  return hits;
}

/**
 * Walks a qa-visual-report.json and returns every blocker, flattened.
 * `[{ path, device, key, count, samples }]`
 */
export function visualBlockers(report) {
  const out = [];
  for (const page of report?.pages ?? []) {
    for (const [device, data] of Object.entries(page.devices ?? {})) {
      for (const { key, count } of blockersIn(data.findings)) {
        const value = data.findings[key];
        out.push({
          path: page.path,
          device,
          key,
          count,
          samples: Array.isArray(value) ? value.slice(0, 3) : [String(value)],
        });
      }
    }
  }
  return out;
}
