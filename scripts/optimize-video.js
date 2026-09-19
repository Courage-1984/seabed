#!/usr/bin/env node
/**
 * Web-optimize an operator-supplied video and install it into a site's assets/.
 *
 * Usage:
 *   node scripts/optimize-video.js --slug <slug> [--input <file>] [--slot "<placement>"]
 *
 *   --input   path to the source video. Defaults to the newest file in ./videos_new/.
 *   --slot    placement slot (see scripts/lib/video-placements.js). Defaults to
 *             meta.videoPlacement when it is already set.
 *   --keep    do not delete the source file on success.
 *
 * Produces, in sites/<YYYY-MM>/<slug>/assets/:
 *   <slug>-<slot>.webm         VP9 2-pass, <=720p, no audio, target <= 2.5 MB
 *   <slug>-<slot>.mp4          H.264 fallback for older iOS/Safari, <= 2.5 MB
 *   <slug>-<slot>-poster.webp  poster frame
 *
 * Requires ffmpeg + ffprobe on PATH. Two-pass logs go to the OS temp dir.
 */
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join, dirname, basename, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { resolveSlugPath } from './lib/resolve-slug.js';
import { VIDEO_PLACEMENTS, VIDEO_PLACEMENT_SET, PLACEMENT_BY_FAMILY, placementSlug } from './lib/video-placements.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VIDEOS_NEW = join(ROOT, 'videos_new');

const MAX_HEIGHT = 720;
const TARGET_BYTES = 2.5 * 1024 * 1024;
/** Bitrate ladder (kbps) tried in order until the output fits TARGET_BYTES. */
const BITRATE_LADDER = [1200, 900, 700, 500, 350];
/** CRF ladder for the H.264 fallback, same purpose: higher CRF, smaller file. */
const CRF_LADDER = [28, 31, 34, 37];

function fail(msg) {
  console.error(`VIDEO_FAIL: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--keep') out.keep = true;
    else if (a.startsWith('--')) out[a.slice(2)] = argv[++i];
  }
  return out;
}

function run(bin, args, opts = {}) {
  const res = spawnSync(bin, args, { encoding: 'utf8', ...opts });
  if (res.error) fail(`${bin} could not be started: ${res.error.message}`);
  return res;
}

function requireBinary(bin) {
  const res = spawnSync(bin, ['-version'], { encoding: 'utf8' });
  if (res.error || res.status !== 0) {
    fail(
      `${bin} is not available on PATH. Install FFmpeg (https://ffmpeg.org/download.html) — ` +
        `it is required to optimize videos and to record the visual-QA walkthrough.`
    );
  }
}

const args = parseArgs(process.argv.slice(2));
if (!args.slug) {
  console.error('Usage: node scripts/optimize-video.js --slug <slug> [--input <file>] [--slot "<placement>"]');
  process.exit(2);
}

requireBinary('ffmpeg');
requireBinary('ffprobe');

const site = resolveSlugPath(ROOT, args.slug);
if (!site) fail(`site not found for slug "${args.slug}"`);
const siteDir = site.absolutePath;
const metaPath = join(siteDir, 'meta.json');
if (!existsSync(metaPath)) fail(`missing meta.json in ${site.relativePath}/`);
const meta = JSON.parse(readFileSync(metaPath, 'utf8'));

// --- resolve the placement slot ---------------------------------------------
const slot = args.slot ?? meta.videoPlacement;
if (!slot) {
  fail(
    `no placement slot. Pass --slot "<placement>" or set meta.videoPlacement first.\n` +
      `  Valid slots: ${VIDEO_PLACEMENTS.join(' | ')}`
  );
}
if (!VIDEO_PLACEMENT_SET.has(slot)) {
  fail(`unknown placement "${slot}". Valid slots: ${VIDEO_PLACEMENTS.join(' | ')}`);
}
const allowed = PLACEMENT_BY_FAMILY[meta.layoutFamily];
if (allowed && !allowed.includes(slot)) {
  fail(
    `placement "${slot}" is not compatible with layoutFamily "${meta.layoutFamily}".\n` +
      `  Allowed: ${allowed.join(' | ')}`
  );
}

// --- resolve the source file -------------------------------------------------
let input = args.input;
if (!input) {
  if (!existsSync(VIDEOS_NEW)) fail(`no --input given and ${relative(ROOT, VIDEOS_NEW)}/ does not exist`);
  const candidates = readdirSync(VIDEOS_NEW)
    .filter((f) => /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(f))
    .map((f) => ({ f, path: join(VIDEOS_NEW, f), mtime: statSync(join(VIDEOS_NEW, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (!candidates.length)
    fail(`no video files found in ${relative(ROOT, VIDEOS_NEW)}/ — drop the download there first`);
  input = candidates[0].path;
  console.log(`Using newest source: videos_new/${candidates[0].f}`);
}
if (!existsSync(input)) fail(`input not found: ${input}`);

// --- probe -------------------------------------------------------------------
const probe = run('ffprobe', [
  '-v',
  'error',
  '-select_streams',
  'v:0',
  '-show_entries',
  'stream=width,height,duration,r_frame_rate',
  '-show_entries',
  'format=duration',
  '-of',
  'json',
  input,
]);
if (probe.status !== 0) fail(`ffprobe failed on ${input}:\n${probe.stderr}`);
const info = JSON.parse(probe.stdout);
const stream = info.streams?.[0] ?? {};
const duration = Number(stream.duration ?? info.format?.duration ?? 0);
if (!duration) fail(`could not determine duration of ${input}`);
console.log(`Source: ${stream.width}x${stream.height}, ${duration.toFixed(2)}s`);
if (duration > 15) {
  console.warn(`VIDEO_WARN: source is ${duration.toFixed(1)}s — site loops should be 5-8s. Consider trimming.`);
}

// --- encode ------------------------------------------------------------------
const slotToken = placementSlug(slot);
const stem = `${site.slug}-${slotToken}`;
const assetsDir = join(siteDir, 'assets');
const webmPath = join(assetsDir, `${stem}.webm`);
const mp4Path = join(assetsDir, `${stem}.mp4`);
const posterPath = join(assetsDir, `${stem}-poster.webp`);

const vfChain = `scale=-2:'min(${MAX_HEIGHT},ih)',fps=30`;

// Two-pass logs must not land in the repo root (the old manual workflow left
// ffmpeg2pass-0.log behind).
const passDir = mkdtempSync(join(tmpdir(), 'ivq-2pass-'));
const passLog = join(passDir, 'ffmpeg2pass');

let chosenBitrate = null;
try {
  for (const kbps of BITRATE_LADDER) {
    console.log(`Encoding VP9 @ ${kbps}k (2-pass)...`);
    const common = ['-y', '-i', input, '-an', '-vf', vfChain, '-c:v', 'libvpx-vp9', '-b:v', `${kbps}k`, '-row-mt', '1'];
    const p1 = run('ffmpeg', [...common, '-pass', '1', '-passlogfile', passLog, '-f', 'null', '-']);
    if (p1.status !== 0) fail(`ffmpeg pass 1 failed:\n${p1.stderr.slice(-2000)}`);
    const p2 = run('ffmpeg', [...common, '-pass', '2', '-passlogfile', passLog, webmPath]);
    if (p2.status !== 0) fail(`ffmpeg pass 2 failed:\n${p2.stderr.slice(-2000)}`);

    const size = statSync(webmPath).size;
    console.log(`  -> ${(size / 1024 / 1024).toFixed(2)} MB`);
    if (size <= TARGET_BYTES) {
      chosenBitrate = kbps;
      break;
    }
    console.log(`  over the ${(TARGET_BYTES / 1024 / 1024).toFixed(1)} MB budget, stepping down...`);
  }
} finally {
  rmSync(passDir, { recursive: true, force: true });
}

if (chosenBitrate === null) {
  console.warn(
    `VIDEO_WARN: still over budget at ${BITRATE_LADDER.at(-1)}k — the source is probably too long. Trim it to 5-8s.`
  );
  chosenBitrate = BITRATE_LADDER.at(-1);
}

// The fallback is held to the same budget as the webm. A flat CRF is fine for
// most sources but blows past it on high-entropy footage (moving water, smoke),
// so step the CRF up until it fits rather than shipping an oversized mp4.
let chosenCrf = null;
for (const crf of CRF_LADDER) {
  console.log(`Encoding H.264 mp4 fallback @ CRF ${crf}...`);
  const mp4 = run('ffmpeg', [
    '-y',
    '-i',
    input,
    '-an',
    '-vf',
    vfChain,
    '-c:v',
    'libx264',
    '-profile:v',
    'main',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    String(crf),
    '-preset',
    'slow',
    '-movflags',
    '+faststart',
    mp4Path,
  ]);
  if (mp4.status !== 0) fail(`ffmpeg mp4 encode failed:\n${mp4.stderr.slice(-2000)}`);

  const size = statSync(mp4Path).size;
  console.log(`  -> ${(size / 1024 / 1024).toFixed(2)} MB`);
  if (size <= TARGET_BYTES) {
    chosenCrf = crf;
    break;
  }
  console.log(`  over the ${(TARGET_BYTES / 1024 / 1024).toFixed(1)} MB budget, stepping down...`);
}
if (chosenCrf === null) {
  console.warn(
    `VIDEO_WARN: mp4 still over budget at CRF ${CRF_LADDER.at(-1)} — the source is probably too long. Trim it to 5-8s.`
  );
}

console.log('Extracting poster frame...');
const posterAt = Math.min(1, duration / 4).toFixed(2);
const poster = run('ffmpeg', [
  '-y',
  '-ss',
  posterAt,
  '-i',
  input,
  '-frames:v',
  '1',
  '-vf',
  vfChain.replace(',fps=30', ''),
  '-c:v',
  'libwebp',
  '-quality',
  '82',
  posterPath,
]);
if (poster.status !== 0) fail(`ffmpeg poster extraction failed:\n${poster.stderr.slice(-2000)}`);

// --- update meta.json --------------------------------------------------------
meta.video = `assets/${stem}.webm`;
meta.videoPlacement = slot;
writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');

// --- clean up the drop-box ---------------------------------------------------
const insideDropBox = !relative(VIDEOS_NEW, input).startsWith('..');
if (insideDropBox && !args.keep) {
  rmSync(input, { force: true });
  console.log(`Removed source videos_new/${basename(input)}`);
}

// --- report ------------------------------------------------------------------
const sizes = {
  webm: statSync(webmPath).size,
  mp4: statSync(mp4Path).size,
  poster: statSync(posterPath).size,
};
console.log(`\nVIDEO_OK: ${site.relativePath}/  placement: ${slot}  bitrate: ${chosenBitrate}k`);
for (const [k, v] of Object.entries(sizes)) {
  console.log(
    `  assets/${basename(k === 'webm' ? webmPath : k === 'mp4' ? mp4Path : posterPath)}  ${(v / 1024).toFixed(0)} KB`
  );
}
console.log(`  meta.video       = ${meta.video}`);
console.log(`  meta.videoPlacement = ${meta.videoPlacement}`);

console.log(`\nPaste this markup into the "${slot}" slot:\n`);
console.log(`<video
  class="site-video"
  autoplay muted loop playsinline
  preload="metadata"
  poster="./assets/${basename(posterPath)}"
  aria-label="TODO: describe the footage for assistive tech"
>
  <source src="./assets/${basename(webmPath)}" type="video/webm" />
  <source src="./assets/${basename(mp4Path)}" type="video/mp4" />
</video>`);
console.log(`
Reminder: pause or hide the loop under @media (prefers-reduced-motion: reduce).`);
