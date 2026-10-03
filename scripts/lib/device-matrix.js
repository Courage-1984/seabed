/**
 * The device matrix every QA script renders against.
 *
 * Single source of truth — qa_sweep.js and visual_qa.js import from here and
 * must not restate viewport numbers, the same way check-site-contract.js takes
 * PLACEMENT_BY_FAMILY from video-placements.js.
 *
 * Phone and tablet entries come from puppeteer's KnownDevices so that
 * isMobile, hasTouch, deviceScaleFactor and userAgent are real rather than
 * hand-typed. hasTouch is the one that matters most: without it
 * `@media (hover: hover)` still matches at 390px and a hover-only affordance
 * looks reachable when on a real phone it is not.
 */
import { KnownDevices } from 'puppeteer';

/**
 * Screenshots are captured at the device pixel ratio, so a 393x851 phone at
 * DPR 3 writes a 1179x2553 tile. Ten devices of that would run to hundreds of
 * megabytes per site and swamp the contact sheets. DPR only changes layout
 * through `image-set()` / `-webkit-min-device-pixel-ratio`, which these sites
 * do not use, so capping at 2 costs no fidelity that the vision pass needs
 * while keeping tiles legible. Pass --full-dpr to render at the true ratio.
 */
const DPR_CAP = 2;

function fromKnown(key, deviceName, note) {
  const device = KnownDevices[deviceName];
  if (!device) throw new Error(`device-matrix: puppeteer has no KnownDevice "${deviceName}"`);
  return {
    key,
    source: deviceName,
    note,
    userAgent: device.userAgent,
    viewport: { ...device.viewport },
  };
}

/** A plain desktop viewport — no UA override, no touch, DPR 1. */
function desktop(key, width, height, note) {
  return {
    key,
    source: null,
    note,
    userAgent: null,
    viewport: { width, height, deviceScaleFactor: 1, isMobile: false, hasTouch: false, isLandscape: false },
  };
}

export const DEVICES = [
  fromKnown('phone-320', 'iPhone SE', 'smallest width still in real use; catches minmax(300px,…) floors'),
  fromKnown('phone-360', 'Galaxy S8', 'the most common Android width'),
  fromKnown('phone-393', 'Pixel 5', 'modern phone baseline'),
  fromKnown('phone-393-short', 'iPhone 14 Pro', 'short viewport — exposes 100vh / min-height:Nvh'),
  fromKnown('phone-landscape', 'iPhone 14 Pro landscape', 'rotation, never covered before'),
  fromKnown('tablet-768', 'iPad Mini', 'tablet portrait'),
  fromKnown('tablet-landscape', 'iPad Mini landscape', 'the 1024px dead zone between breakpoints'),
  desktop('laptop-1280', 1280, 800, 'small laptop'),
  desktop('desktop-1440', 1440, 900, 'the previous baseline — kept so old findings stay comparable'),
  desktop('wide-1920', 1920, 1080, 'the previous wide baseline'),
];

/** Every device. The default for `qa` and `qa:visual`. */
export const CORE = DEVICES.map((d) => d.key);

/** A four-device subset for iterating on a fix without paying for ten renders. */
export const FAST = ['phone-320', 'phone-393', 'tablet-768', 'desktop-1440'];

export const DEVICE_BY_KEY = Object.fromEntries(DEVICES.map((d) => [d.key, d]));

/**
 * Resolve a --devices value: "core", "fast", or a comma-separated list of keys.
 * Returns device descriptors in matrix order, not the order given, so reports
 * from different runs line up column for column.
 */
export function resolveDevices(spec, { fullDpr = false } = {}) {
  const raw = (spec || 'core').trim().toLowerCase();
  let keys;
  if (raw === 'core' || raw === 'all') keys = CORE;
  else if (raw === 'fast') keys = FAST;
  else {
    keys = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const unknown = keys.filter((k) => !DEVICE_BY_KEY[k]);
    if (unknown.length) {
      throw new Error(
        `Unknown device key(s): ${unknown.join(', ')}\nAvailable: ${CORE.join(', ')}\nOr use: core | fast`
      );
    }
  }
  const wanted = new Set(keys);
  return DEVICES.filter((d) => wanted.has(d.key)).map((d) => ({
    ...d,
    viewport: {
      ...d.viewport,
      deviceScaleFactor: fullDpr ? d.viewport.deviceScaleFactor : Math.min(d.viewport.deviceScaleFactor, DPR_CAP),
    },
  }));
}

/**
 * Put a page into this device's shape. Both scripts go through here so touch
 * and UA can never be set in one and forgotten in the other.
 *
 * `defaultUserAgent` is the browser's own UA (await browser.userAgent()), used
 * to reset after a phone: without it the desktop devices in the same run would
 * keep whichever mobile UA was set last.
 */
export async function applyDevice(page, device, defaultUserAgent) {
  await page.setViewport(device.viewport);
  await page.setUserAgent(device.userAgent || defaultUserAgent || '');
}

/** Short label for logs and sheet captions, e.g. "phone-320 (320x568 @2x, touch)". */
export function describeDevice(device) {
  const v = device.viewport;
  const bits = [`${v.width}x${v.height}`];
  if (v.deviceScaleFactor !== 1) bits.push(`@${v.deviceScaleFactor}x`);
  if (v.hasTouch) bits.push('touch');
  return `${device.key} (${bits.join(' ')})`;
}
