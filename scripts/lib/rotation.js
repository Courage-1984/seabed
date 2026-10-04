/**
 * The Variety Engine, in code. One source of truth for:
 *   - npm run sites:index   (the Anti-repetition state + Rotation schedule pasted into Gemini)
 *   - npm run roll          (resolve a day's values from real history)
 *   - npm run check:variety (the ship-time gate)
 *
 * Why it moved out of the prompt: the brief writer did the modular arithmetic
 * and applied the bans itself, from a block pasted about once a week. The block
 * went stale (sites built mid-week were invisible to it), the bans were not
 * applied even when present, and nothing in the repo checked. Palette and fonts
 * were not rolled at all. Now every value is rolled here, pre-computed as a
 * dated schedule whose rows ban each other, and checked against what actually
 * shipped.
 *
 * Rotation + randomness: each dimension removes recently-used values (rotation),
 * then draws from the rest at random, weighted towards the values used longest
 * ago (see weighted-pick.js). Seeded per (date, dimension) so a row is
 * reproducible and auditable.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findAllSiteDirs } from './resolve-slug.js';
import { LAYOUT_FAMILIES } from './layout-families.js';
import { VIDEO_PLACEMENTS, PLACEMENT_BY_FAMILY, PLACEMENT_BAN_WINDOW } from './video-placements.js';
import { SIGNATURE_EFFECTS, EFFECT_BAN_WINDOW } from './signature-effects.js';
import {
  STYLE_FAMILIES,
  STYLE_FAMILY_SET,
  STYLE_FAMILY_BY_NAME,
  STYLE_BAN_WINDOW,
  ATTRACTOR_BASE,
  ATTRACTOR_FAMILY,
  expectedBase,
  resolveStyleFamily,
} from './style-families.js';
import {
  ARCHITECTURE_NAMES,
  SECTOR_NAMES,
  TONES,
  TWIST_AXES,
  NAMING_STYLES,
  architectureFromMeta,
  sectorFromMeta,
} from './brief-axes.js';
import { siteFingerprint } from './site-fingerprint.js';
import { pickRotated, rngFor, hashString } from './weighted-pick.js';

/** Sites created on/after this date must carry meta.styleFamily and pass check:variety. */
export const ROTATION_CUTOFF = '2026-10-04';

export const WINDOWS = {
  layout: 8,
  /** Cannot bind while layout bans 8 of 17; kept to catch legacy-history skew. */
  layoutCap: { window: 25, max: 5 },
  placement: PLACEMENT_BAN_WINDOW,
  effect: EFFECT_BAN_WINDOW,
  /** Style families rotate in equal cycles (see styleCycle); this is the minimum gap, including across cycles. */
  style: STYLE_BAN_WINDOW,
  /** Any font family used by the previous N sites is banned. */
  font: 6,
  /** ...and so is any family used `max`+1 or more times in the last `window`. */
  fontOveruse: { window: 20, max: 2 },
  /** Palette base (ground|primary) may not match any of the previous N sites. */
  paletteBase: 3,
  /** Full palette signature (ground|primary|accent) may not match any of the previous N. */
  paletteSignature: 6,
  architecture: 1,
  sector: 4,
  tone: 3,
  twist: 3,
  naming: 2,
};

/** One style cycle: every family exactly once. */
export const STYLE_CYCLE = STYLE_FAMILIES.length;

/** CTA vocabulary that drifted across most recent sites. */
export const DRIFT_CTA = /\b(requisition|initiate|transmit|protocol)\b/i;

export const todayUtc = () => new Date().toISOString().slice(0, 10);

export function addDays(date, n) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Every site, newest first.
 *
 * With `beforeDate`: only sites created before that date, plus same-day siblings
 * (placed first -- they are the newest), minus `excludeSlug`. Same-day siblings
 * therefore ban each other symmetrically.
 *
 * @returns {Array<object>} records with meta fields, the resolved styleFamily,
 *   inferred architecture/sector, and the shipped fonts + palette fingerprint
 */
export function loadHistory(root, { beforeDate = null, excludeSlug = null } = {}) {
  const records = [];
  for (const site of findAllSiteDirs(root)) {
    if (site.slug === excludeSlug) continue;
    let meta = {};
    try {
      meta = JSON.parse(readFileSync(join(site.absolutePath, 'meta.json'), 'utf8'));
    } catch {
      /* keep an empty record so the slug still shows up */
    }
    if (beforeDate && !(typeof meta.created === 'string' && meta.created <= beforeDate)) continue;
    const fp = siteFingerprint(site.absolutePath);
    const style = resolveStyleFamily(site.slug, meta, fp.vars);
    records.push({
      slug: site.slug,
      relativePath: site.relativePath,
      absolutePath: site.absolutePath,
      title: meta.title,
      created: meta.created,
      layoutFamily: meta.layoutFamily ?? meta.layout,
      videoPlacement: meta.videoPlacement,
      signatureEffect: meta.signatureEffect,
      styleFamily: style.family ?? undefined,
      styleSource: style.source,
      architecture: architectureFromMeta(meta),
      sector: sectorFromMeta(meta),
      tone: TONES.includes(meta.tone) ? meta.tone : undefined,
      twistAxis: undefined,
      namingStyle: undefined,
      fonts: fp.fonts,
      palette: fp.palette,
    });
  }
  records.sort(
    (a, b) => String(b.created ?? '').localeCompare(String(a.created ?? '')) || a.slug.localeCompare(b.slug)
  );
  return records;
}

const valuesOf = (history, field) => history.map((h) => h[field]);

/** Fonts banned for the next site: used in the previous WINDOWS.font sites, or overused recently. */
export function bannedFonts(history) {
  const recent = new Set(history.slice(0, WINDOWS.font).flatMap((h) => h.fonts ?? []));
  const counts = new Map();
  for (const h of history.slice(0, WINDOWS.fontOveruse.window)) {
    for (const f of h.fonts ?? []) counts.set(f, (counts.get(f) ?? 0) + 1);
  }
  const overused = new Set([...counts].filter(([, n]) => n > WINDOWS.fontOveruse.max).map(([f]) => f));
  return { recent, overused, all: new Set([...recent, ...overused]) };
}

const pairKey = ([h, b]) => `${h} + ${b}`;

/**
 * Equal rotation of style families.
 *
 * Sites created on/after ROTATION_CUTOFF are counted off in cycles of 14: each
 * cycle uses every family exactly once, in its own random order. A cycle's order
 * is planned when it starts, under one constraint -- no family may land within
 * STYLE_BAN_WINDOW sites of its last use before the cycle -- so the seam between
 * two cycles never puts a family back to back (or near it). That constraint can
 * always be met: the families' last-use gaps are distinct, so at position q at
 * least q + 7 families are eligible.
 *
 * Stateless: the cycle, its plan and what it has used so far are all derived
 * from history, so the schedule, roll and the gate agree.
 *
 * @returns {{ cycle: number, position: number, used: Set<string>, remaining: string[], plan: string[] }}
 *   `remaining` is the plan's unused families, in planned order
 */
export function styleCycle(history) {
  const counted = history.filter(
    (h) => typeof h.created === 'string' && h.created >= ROTATION_CUTOFF && STYLE_FAMILY_SET.has(h.styleFamily)
  );
  const cycle = Math.floor(counted.length / STYLE_CYCLE);
  const position = counted.length % STYLE_CYCLE;
  const current = counted.slice(0, position);
  const used = new Set(current.map((h) => h.styleFamily));
  const before = position ? history.slice(history.indexOf(current[position - 1]) + 1) : history;
  const plan = planStyleCycle(cycle, before);
  return { cycle, position, used, remaining: plan.filter((f) => !used.has(f)), plan };
}

/** One cycle's random order. `before` is the history up to the cycle's first site, newest first. */
export function planStyleCycle(cycle, before) {
  const styles = valuesOf(before, 'styleFamily');
  const gapBefore = (f) => {
    const i = styles.indexOf(f);
    return i === -1 ? Infinity : i + 1;
  };
  const earliest = new Map(STYLE_FAMILIES.map((f) => [f, Math.max(0, WINDOWS.style + 1 - gapBefore(f))]));
  const rng = rngFor(`cycle-${cycle}`, 'style', hashString(styles.slice(0, STYLE_CYCLE).join('|')));
  const left = [...STYLE_FAMILIES];
  const plan = [];
  for (let q = 0; q < STYLE_CYCLE; q++) {
    const eligible = left.filter((f) => earliest.get(f) <= q);
    const from = eligible.length ? eligible : left;
    const pick = from[Math.floor(rng() * from.length)];
    plan.push(pick);
    left.splice(left.indexOf(pick), 1);
  }
  return plan;
}

/**
 * Roll every value for one date.
 * `nth` separates two sites on the same date (the second gets a different stream);
 * it defaults to 1 + the number of same-day sites already in history.
 */
export function rollDay(date, history, { nth } = {}) {
  const n = nth ?? 1 + history.filter((h) => h.created === date).length;
  const rng = (dim) => rngFor(date, dim, n);
  const fallbacks = [];
  const take = (dim, result) => {
    if (result.fallback) fallbacks.push(dim);
    return result.value;
  };

  // Style first: the next family in this cycle's planned order. Following the plan
  // always clears the gap rule; the check only matters if history went off-plan.
  const { remaining } = styleCycle(history);
  const recentStyles = valuesOf(history, 'styleFamily').slice(0, WINDOWS.style);
  let styleFamily = remaining.find((f) => !recentStyles.includes(f));
  if (!styleFamily) {
    styleFamily = remaining[0];
    fallbacks.push('style');
  }

  // Then a layout the style family may pair with.
  const layoutFamily = take(
    'layout',
    pickRotated(LAYOUT_FAMILIES, valuesOf(history, 'layoutFamily'), {
      ban: WINDOWS.layout,
      cap: WINDOWS.layoutCap,
      exclude: STYLE_FAMILY_BY_NAME[styleFamily].excludeLayouts,
      rng: rng('layout'),
    })
  );

  // Font pairing: one of the family's pairings, none of whose faces are banned.
  // If every pairing is blocked, the least-recently-used one is returned and flagged.
  const banned = bannedFonts(history).all;
  const pairs = STYLE_FAMILY_BY_NAME[styleFamily].fonts;
  const pairKeys = pairs.map(pairKey);
  const pairHistory = history.map((h) => {
    const used = pairs.find(([a, b]) => h.fonts?.includes(a) && h.fonts?.includes(b));
    return used ? pairKey(used) : undefined;
  });
  const blocked = pairs.filter((p) => p.some((f) => banned.has(f))).map(pairKey);
  const fontsKey = pickRotated(pairKeys, pairHistory, {
    exclude: blocked.length < pairs.length ? blocked : [],
    rng: rng('fonts'),
  }).value;
  const fonts = pairs[pairKeys.indexOf(fontsKey)];
  if (blocked.includes(fontsKey)) fallbacks.push('fonts');

  const videoPlacement = take(
    'placement',
    pickRotated(VIDEO_PLACEMENTS, valuesOf(history, 'videoPlacement'), {
      ban: WINDOWS.placement,
      allowed: PLACEMENT_BY_FAMILY[layoutFamily],
      rng: rng('placement'),
    })
  );

  const signatureEffect = take(
    'effect',
    pickRotated(SIGNATURE_EFFECTS, valuesOf(history, 'signatureEffect'), { ban: WINDOWS.effect, rng: rng('effect') })
  );

  const axis = (dim, pool, field, ban) =>
    take(dim, pickRotated(pool, valuesOf(history, field), { ban, rng: rng(dim) }));

  return {
    date,
    nth: n,
    architecture: axis('architecture', ARCHITECTURE_NAMES, 'architecture', WINDOWS.architecture),
    layoutFamily,
    styleFamily,
    fonts,
    videoPlacement,
    signatureEffect,
    sector: axis('sector', SECTOR_NAMES, 'sector', WINDOWS.sector),
    tone: axis('tone', TONES, 'tone', WINDOWS.tone),
    twistAxis: axis('twist', TWIST_AXES, 'twistAxis', WINDOWS.twist),
    namingStyle: axis('naming', NAMING_STYLES, 'namingStyle', WINDOWS.naming),
    fallbacks,
  };
}

/** A rolled row, shaped like a history record so later rows ban it. Palette is unknown until built. */
function rowAsRecord(row) {
  return { ...row, slug: `(scheduled ${row.date})`, created: row.date, fonts: row.fonts, palette: null };
}

/**
 * Roll `days` consecutive dates. Each row joins a virtual history before the next
 * is rolled, so rows inside one schedule ban each other -- a schedule pasted once
 * a week can no longer repeat itself mid-week.
 */
export function buildSchedule(startDate, days, history) {
  const virtual = [...history];
  const rows = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(startDate, i);
    const row = rollDay(date, virtual, { nth: 1 });
    rows.push(row);
    virtual.unshift(rowAsRecord(row));
  }
  return rows;
}

const agoText = (history, field, value) => {
  const i = history.findIndex((h) => h[field] === value);
  return i === -1 ? '' : ` (used ${i + 1} site${i ? 's' : ''} ago: ${history[i].slug})`;
};

/**
 * Judge one site's rolled + shipped values against the sites before it.
 *
 * @param {object} site - { layoutFamily, videoPlacement, signatureEffect, styleFamily, fonts, palette, ctaTexts }
 * @param {object[]} history - newest first, excluding the site itself (see loadHistory)
 * @returns {{ fails: string[], warns: string[] }}
 */
export function varietyFindings(site, history) {
  const fails = [];
  const warns = [];

  // Layout.
  const layouts = valuesOf(history, 'layoutFamily');
  if (layouts.slice(0, WINDOWS.layout).includes(site.layoutFamily)) {
    fails.push(
      `layoutFamily "${site.layoutFamily}" is inside the ${WINDOWS.layout}-site ban${agoText(history, 'layoutFamily', site.layoutFamily)}`
    );
  }
  const capCount = layouts.slice(0, WINDOWS.layoutCap.window).filter((l) => l === site.layoutFamily).length;
  if (capCount >= WINDOWS.layoutCap.max) {
    fails.push(
      `layoutFamily "${site.layoutFamily}" already used ${capCount}x in the last ${WINDOWS.layoutCap.window} sites (cap ${WINDOWS.layoutCap.max})`
    );
  }

  // Video placement: banned only while a compatible slot was free.
  const placements = valuesOf(history, 'videoPlacement');
  const bannedSlots = new Set(placements.slice(0, WINDOWS.placement));
  if (bannedSlots.has(site.videoPlacement)) {
    const free = (PLACEMENT_BY_FAMILY[site.layoutFamily] ?? []).filter((s) => !bannedSlots.has(s));
    if (free.length) {
      fails.push(
        `videoPlacement "${site.videoPlacement}" is inside the ${WINDOWS.placement}-site ban${agoText(history, 'videoPlacement', site.videoPlacement)}; free compatible slots: ${free.join(', ')}`
      );
    } else {
      warns.push(`videoPlacement "${site.videoPlacement}" reused: every compatible slot was banned (allowed fallback)`);
    }
  }

  // Signature effect.
  if (valuesOf(history, 'signatureEffect').slice(0, WINDOWS.effect).includes(site.signatureEffect)) {
    fails.push(
      `signatureEffect "${site.signatureEffect}" is inside the ${WINDOWS.effect}-site ban${agoText(history, 'signatureEffect', site.signatureEffect)}`
    );
  }

  // Style family.
  if (!site.styleFamily) {
    fails.push(`meta.styleFamily missing -- one of: ${STYLE_FAMILIES.join(' | ')}`);
  } else if (!STYLE_FAMILY_SET.has(site.styleFamily)) {
    fails.push(`meta.styleFamily "${site.styleFamily}" is not one of: ${STYLE_FAMILIES.join(' | ')}`);
  } else {
    const { cycle, position, used, remaining } = styleCycle(history);
    if (used.has(site.styleFamily)) {
      fails.push(
        `styleFamily "${site.styleFamily}" was already used in this rotation cycle (cycle ${cycle + 1}, ${position}/${STYLE_CYCLE} built) -- each cycle uses every family once; still unused: ${remaining.join(', ')}`
      );
    } else if (valuesOf(history, 'styleFamily').slice(0, WINDOWS.style).includes(site.styleFamily)) {
      fails.push(
        `styleFamily "${site.styleFamily}" is inside the ${WINDOWS.style}-site gap${agoText(history, 'styleFamily', site.styleFamily)}`
      );
    }
    if (STYLE_FAMILY_BY_NAME[site.styleFamily].excludeLayouts.includes(site.layoutFamily)) {
      fails.push(`styleFamily "${site.styleFamily}" may not pair with layoutFamily "${site.layoutFamily}"`);
    }
  }

  // Fonts.
  if (!site.fonts?.length) {
    warns.push('no fonts found yet (no Google Fonts link) -- re-run once index.html exists');
  } else {
    const { recent, overused } = bannedFonts(history);
    for (const f of site.fonts) {
      if (recent.has(f)) {
        const i = history.findIndex((h) => h.fonts?.includes(f));
        fails.push(`font "${f}" was used ${i + 1} site${i ? 's' : ''} ago (${history[i].slug}); ban ${WINDOWS.font}`);
      } else if (overused.has(f)) {
        fails.push(
          `font "${f}" is overused: ${WINDOWS.fontOveruse.max + 1}+ of the last ${WINDOWS.fontOveruse.window} sites`
        );
      }
    }
  }

  // Palette.
  if (!site.palette) {
    warns.push(
      'palette not readable yet -- declare --color-bg, --color-text, --color-primary, --color-accent in :root'
    );
  } else {
    const p = site.palette;
    if (p.base === ATTRACTOR_BASE && site.styleFamily !== ATTRACTOR_FAMILY) {
      fails.push(
        `palette base "${p.base}" (light grey ground + navy-ink primary) is reserved for "${ATTRACTOR_FAMILY}" -- it is the look 30 of 31 sites converged on`
      );
    }
    const withPalette = history.filter((h) => h.palette);
    const baseHit = withPalette.slice(0, WINDOWS.paletteBase).find((h) => h.palette.base === p.base);
    if (baseHit) {
      fails.push(`palette base "${p.base}" matches ${baseHit.slug} (one of the previous ${WINDOWS.paletteBase} sites)`);
    }
    const sigHit = withPalette.slice(0, WINDOWS.paletteSignature).find((h) => h.palette.signature === p.signature);
    if (sigHit && !baseHit) {
      fails.push(
        `palette signature "${p.signature}" matches ${sigHit.slug} (one of the previous ${WINDOWS.paletteSignature} sites)`
      );
    }
    const [a, b] = withPalette;
    if (a && b && p.accent !== 'neutral' && a.palette.accent === p.accent && b.palette.accent === p.accent) {
      warns.push(`accent hue "${p.accent}" is the third in a row (${a.slug}, ${b.slug})`);
    }
    const expect = STYLE_FAMILY_SET.has(site.styleFamily) ? expectedBase(site.styleFamily) : null;
    if (expect && p.base !== expect) {
      warns.push(
        `palette base "${p.base}" is not the base "${site.styleFamily}" usually produces ("${expect}") -- confirm the palette follows the family`
      );
    }
  }

  // CTA vocabulary.
  const drift = [...new Set((site.ctaTexts ?? []).filter((t) => DRIFT_CTA.test(t)))];
  if (drift.length)
    warns.push(`CTA wording drifts to the recent house voice: ${drift.map((t) => `"${t}"`).join(', ')}`);

  return { fails, warns };
}
