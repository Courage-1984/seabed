/**
 * Shared Vite-preview lifecycle and worker pool for the QA sweeps.
 *
 * Both scripts/qa_sweep.js and scripts/visual_qa.js drive the built `dist/`
 * through `npm run preview`; this module owns starting it, waiting for it, and
 * killing it (including the Windows process-tree case).
 */
import { spawn } from 'node:child_process';

export const PREVIEW_HOST = '127.0.0.1';
export const PREVIEW_PORT = 4173;
export const PREVIEW_URL = `http://${PREVIEW_HOST}:${PREVIEW_PORT}/`;

/** Bounded-concurrency map. Preserves input order in the result array. */
export async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const n = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

export async function waitForServer(url = PREVIEW_URL, timeout = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* poll */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not start at ${url}`);
}

/**
 * Spawns `npm run preview` and resolves once it answers.
 * Returns the child process; pass it to stopPreviewServer() in a finally block.
 */
export async function startPreviewServer({ stdio = 'inherit', settleMs = 2000 } = {}) {
  const server = spawn(
    'npm',
    ['run', 'preview', '--', '--host', PREVIEW_HOST, '--port', String(PREVIEW_PORT), '--strictPort'],
    { shell: true, stdio }
  );
  await waitForServer(PREVIEW_URL);
  if (settleMs) await new Promise((r) => setTimeout(r, settleMs));
  return server;
}

export function stopPreviewServer(server) {
  if (!server) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', server.pid, '/f', '/t']);
  } else {
    server.kill();
  }
}
