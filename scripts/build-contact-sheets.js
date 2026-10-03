#!/usr/bin/env node
/**
 * Composites visual-QA evidence into sheets an agent can actually look at.
 *
 * The Extreme Visual Audit (AGENTS.md 14) told the agent to review every tile
 * — ~60 per site, now ~200 across ten devices — and to "watch
 * qa-recordings/<slug>-walkthrough.webm end to end", which an agent cannot
 * open at all. Neither instruction was performable, so neither was performed,
 * and ten defective video clips shipped through green gates (commit 99aebcb)
 * before anyone looked.
 *
 * Three kinds of sheet come out of here:
 *
 *   wall-<page>.png         every device's full page side by side. One glance
 *                           answers "is mobile broken", which is the question
 *                           that went unanswered on imperivm-spqr.
 *   detail-<page>-<dev>.png tiles at a legible cell width. 640px native cells
 *                           are not arbitrary: the previous campaign's 320px
 *                           sheets missed #f2a900 and three hsl() leaks
 *                           outright, and the rebuild at 640 caught them.
 *   walkthrough-<slug>.png  frames pulled from the recording with ffmpeg.
 *
 * Detail sheets cover a representative subset of devices; the heuristics and
 * the wall cover all ten. Reviewing 200 tiles one file at a time is not a
 * thing anyone will do, and a review protocol nobody follows is what this is
 * replacing.
 */
import sharp from 'sharp';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

/** Devices that get tile-by-tile sheets. The rest appear in the wall. */
const DETAIL_DEVICES = ['phone-320', 'phone-393', 'phone-landscape', 'tablet-768', 'laptop-1280', 'desktop-1440', 'reduced-motion', 'interaction'];

/** Cell width for detail sheets. Below ~480 small on-screen text stops being readable. */
const CELL_WIDTH = 480;
/** Cells per detail sheet, as columns x rows. */
const GRID_COLS = 3;
const GRID_ROWS = 3;

/** Column width in the device wall, the tallest one band may be, and how many
 *  bands a single device may be split across before we stop. */
const WALL_COL_WIDTH = 290;
const WALL_MAX_HEIGHT = 2200;
const WALL_MAX_BANDS = 3;

const CAPTION_HEIGHT = 26;
const GUTTER = 10;
const BG = { r: 24, g: 24, b: 27, alpha: 1 };

const xmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A caption strip as an SVG buffer — sharp has no text primitive of its own. */
function caption(text, width, { height = CAPTION_HEIGHT, size = 15, colour = '#e4e4e7' } = {}) {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#18181b"/>
  <text x="6" y="${Math.round(height * 0.7)}" font-family="DejaVu Sans, Verdana, sans-serif" font-size="${size}" fill="${colour}">${xmlEscape(text)}</text>
</svg>`;
  return Buffer.from(svg);
}

async function safeMeta(file) {
  try {
    return await sharp(file).metadata();
  } catch {
    return null;
  }
}

/**
 * Every device's full page, scaled to a common column width and laid out in
 * rows. Deliberately small: this sheet is for spotting gross breakage —
 * overflow, an unconstrained image, a grid that did not collapse — not for
 * reading body copy.
 */
async function buildWall({ shotDir, sheetDir, slug, pageKey, devices }) {
  const columns = [];
  for (const deviceKey of devices) {
    const full = join(shotDir, pageKey, deviceKey, 'full.png');
    if (!existsSync(full)) continue;
    const meta = await safeMeta(full);
    if (!meta?.width) continue;

    // Scale to the column width and nothing else. `fit: 'inside'` against both
    // the width and the height cap honoured whichever was tighter, and for a
    // 640x16000 phone capture that is the height -- so every long page rendered
    // at ~88px wide inside a 290px slot: an illegible sliver in a sheet of
    // empty gutter, which is exactly what this sheet exists to avoid.
    const scaled = await sharp(full).resize({ width: WALL_COL_WIDTH }).toBuffer();
    const scaledMeta = await sharp(scaled).metadata();

    // A tall page becomes side-by-side bands read left to right, rather than
    // being squashed until nothing is readable.
    const bandCount = Math.min(WALL_MAX_BANDS, Math.max(1, Math.ceil(scaledMeta.height / WALL_MAX_HEIGHT)));
    const bandHeight = Math.ceil(scaledMeta.height / bandCount);
    for (let b = 0; b < bandCount; b++) {
      const top = b * bandHeight;
      const height = Math.min(bandHeight, scaledMeta.height - top);
      if (height <= 0) continue;
      const body =
        bandCount === 1
          ? scaled
          : await sharp(scaled).extract({ left: 0, top, width: scaledMeta.width, height }).toBuffer();
      columns.push({
        deviceKey,
        label: bandCount === 1 ? `${deviceKey} (${meta.height}px)` : `${deviceKey} ${b + 1}/${bandCount}`,
        body,
        width: scaledMeta.width,
        height,
        pageHeight: meta.height,
      });
    }
  }
  if (!columns.length) return null;

  const perRow = Math.min(5, columns.length);
  const rows = [];
  for (let i = 0; i < columns.length; i += perRow) rows.push(columns.slice(i, i + perRow));

  const rowHeights = rows.map((row) => Math.max(...row.map((c) => c.height)) + CAPTION_HEIGHT);
  const canvasWidth = perRow * WALL_COL_WIDTH + (perRow + 1) * GUTTER;
  const canvasHeight = rowHeights.reduce((a, b) => a + b + GUTTER, GUTTER) + CAPTION_HEIGHT + GUTTER;

  const composites = [
    { input: caption(`${slug} — ${pageKey} — device wall`, canvasWidth, { size: 17 }), top: GUTTER / 2, left: 0 },
  ];
  let top = CAPTION_HEIGHT + GUTTER;
  rows.forEach((row, rowIndex) => {
    let left = GUTTER;
    for (const col of row) {
      composites.push({ input: caption(col.label, WALL_COL_WIDTH), top, left });
      composites.push({ input: col.body, top: top + CAPTION_HEIGHT, left });
      left += WALL_COL_WIDTH + GUTTER;
    }
    top += rowHeights[rowIndex] + GUTTER;
  });

  const out = join(sheetDir, `wall-${pageKey}.png`);
  await sharp({ create: { width: canvasWidth, height: canvasHeight, channels: 4, background: BG } })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(out);
  return out;
}

/** Tiles for one device, in reading order, at a legible cell width. */
async function buildDetail({ shotDir, sheetDir, slug, pageKey, deviceKey }) {
  const dir = join(shotDir, pageKey, deviceKey);
  if (!existsSync(dir)) return [];
  const tiles = readdirSync(dir)
    .filter((f) => /^tile-\d+\.png$/.test(f))
    .sort();
  if (!tiles.length) return [];

  const perSheet = GRID_COLS * GRID_ROWS;
  const sheets = [];
  for (let start = 0; start < tiles.length; start += perSheet) {
    const batch = tiles.slice(start, start + perSheet);
    const cells = [];
    for (const name of batch) {
      const file = join(dir, name);
      const meta = await safeMeta(file);
      if (!meta?.width) continue;
      const body = await sharp(file).resize(CELL_WIDTH, null, { fit: 'inside' }).toBuffer();
      const bodyMeta = await sharp(body).metadata();
      cells.push({ name, body, height: bodyMeta.height });
    }
    if (!cells.length) continue;

    const cellHeight = Math.max(...cells.map((c) => c.height)) + CAPTION_HEIGHT;
    const rows = Math.ceil(cells.length / GRID_COLS);
    const canvasWidth = GRID_COLS * CELL_WIDTH + (GRID_COLS + 1) * GUTTER;
    const canvasHeight = CAPTION_HEIGHT + GUTTER + rows * (cellHeight + GUTTER) + GUTTER;

    const sheetIndex = Math.floor(start / perSheet) + 1;
    const total = Math.ceil(tiles.length / perSheet);
    const composites = [
      {
        input: caption(
          `${slug} — ${pageKey} — ${deviceKey} — sheet ${sheetIndex}/${total} (tiles ${start + 1}-${start + cells.length} of ${tiles.length}, top to bottom)`,
          canvasWidth,
          { size: 16 }
        ),
        top: 0,
        left: 0,
      },
    ];
    cells.forEach((cell, i) => {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const left = GUTTER + col * (CELL_WIDTH + GUTTER);
      const top = CAPTION_HEIGHT + GUTTER + row * (cellHeight + GUTTER);
      composites.push({ input: caption(cell.name, CELL_WIDTH, { size: 13 }), top, left });
      composites.push({ input: cell.body, top: top + CAPTION_HEIGHT, left });
    });

    const out = join(sheetDir, `detail-${pageKey}-${deviceKey}-${String(sheetIndex).padStart(2, '0')}.png`);
    await sharp({ create: { width: canvasWidth, height: canvasHeight, channels: 4, background: BG } })
      .composite(composites)
      .png({ compressionLevel: 9 })
      .toFile(out);
    sheets.push({ out, sheetIndex, total, count: cells.length, tiles: tiles.length });
  }
  return sheets;
}

/**
 * Frames from the walkthrough recording. The .webm is unreadable to an agent,
 * so the instruction to watch it has always been dead letter; nine stills of
 * the scripted scroll, hover and navigation pass make it reviewable.
 */
async function buildWalkthrough({ root, sheetDir, slug, recording }) {
  if (!recording) return null;
  const src = join(root, recording);
  if (!existsSync(src)) return null;

  const probe = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src],
    { encoding: 'utf8' }
  );
  const duration = Number(String(probe.stdout || '').trim());
  if (!Number.isFinite(duration) || duration <= 0) return null;

  const frameCount = 9;
  const tmp = join(sheetDir, '.frames');
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });

  const frames = [];
  for (let i = 0; i < frameCount; i++) {
    // Evenly spaced, inset from both ends so the first frame is not the black
    // pre-roll and the last is not the tail of a navigation.
    const t = duration * ((i + 0.5) / frameCount);
    const file = join(tmp, `f${String(i).padStart(2, '0')}.png`);
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', src, '-frames:v', '1', file], {
      encoding: 'utf8',
    });
    if (r.status === 0 && existsSync(file)) frames.push({ file, t });
  }
  if (!frames.length) {
    rmSync(tmp, { recursive: true, force: true });
    return null;
  }

  const cells = [];
  for (const frame of frames) {
    const body = await sharp(frame.file).resize(CELL_WIDTH, null, { fit: 'inside' }).toBuffer();
    const meta = await sharp(body).metadata();
    cells.push({ body, height: meta.height, label: `t=${frame.t.toFixed(1)}s` });
  }

  const cellHeight = Math.max(...cells.map((c) => c.height)) + CAPTION_HEIGHT;
  const rows = Math.ceil(cells.length / GRID_COLS);
  const canvasWidth = GRID_COLS * CELL_WIDTH + (GRID_COLS + 1) * GUTTER;
  const canvasHeight = CAPTION_HEIGHT + GUTTER + rows * (cellHeight + GUTTER) + GUTTER;

  const composites = [
    {
      input: caption(`${slug} — walkthrough (scroll, hover, navigation) — ${duration.toFixed(1)}s`, canvasWidth, {
        size: 16,
      }),
      top: 0,
      left: 0,
    },
  ];
  cells.forEach((cell, i) => {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const left = GUTTER + col * (CELL_WIDTH + GUTTER);
    const top = CAPTION_HEIGHT + GUTTER + row * (cellHeight + GUTTER);
    composites.push({ input: caption(cell.label, CELL_WIDTH, { size: 13 }), top, left });
    composites.push({ input: cell.body, top: top + CAPTION_HEIGHT, left });
  });

  const out = join(sheetDir, `walkthrough-${slug}.png`);
  await sharp({ create: { width: canvasWidth, height: canvasHeight, channels: 4, background: BG } })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(out);
  rmSync(tmp, { recursive: true, force: true });
  return out;
}

/**
 * @returns {Promise<Array<{path: string, kind: string, caption: string}>>}
 *   repo-relative sheet paths, in the order they should be reviewed.
 */
export async function buildContactSheets({ root, slug, shotDir, pages, recording }) {
  const sheetDir = join(shotDir, 'sheets');
  rmSync(sheetDir, { recursive: true, force: true });
  mkdirSync(sheetDir, { recursive: true });

  const sheets = [];
  const rel = (p) => relative(root, p).replace(/\\/g, '/');

  for (const page of pages) {
    const pageKey = page.path
      .replace(/^sites\//, '')
      .replace(/\//g, '__')
      .replace(/\.html$/, '');
    const deviceKeys = Object.keys(page.devices ?? {});

    const wall = await buildWall({ shotDir, sheetDir, slug, pageKey, devices: deviceKeys });
    if (wall) {
      sheets.push({
        path: rel(wall),
        kind: 'wall',
        caption: `${page.path} — all ${deviceKeys.length} devices side by side. Look for overflow, uncollapsed grids and oversized media.`,
      });
    }

    for (const deviceKey of deviceKeys) {
      if (!DETAIL_DEVICES.includes(deviceKey)) continue;
      const detail = await buildDetail({ shotDir, sheetDir, slug, pageKey, deviceKey });
      for (const sheet of detail) {
        sheets.push({
          path: rel(sheet.out),
          kind: 'detail',
          caption: `${page.path} @${deviceKey} — tiles ${sheet.sheetIndex}/${sheet.total} (${sheet.count} of ${sheet.tiles}). Read the copy: legibility, contrast, spacing, clipping.`,
        });
      }
    }
  }

  const walkthrough = await buildWalkthrough({ root, sheetDir, slug, recording });
  if (walkthrough) {
    sheets.push({
      path: rel(walkthrough),
      kind: 'walkthrough',
      caption:
        'Walkthrough frames — layout shift during scroll, animations that never fire, sticky collisions, dead hover states, video showing a black frame.',
    });
  }

  return sheets;
}
