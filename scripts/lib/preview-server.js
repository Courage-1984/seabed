/**
 * Shared Vite-preview lifecycle and worker pool for the QA sweeps.
 *
 * Both scripts/qa_sweep.js and scripts/visual_qa.js drive the built `dist/`
 * through `npm run preview`; this module owns starting it, waiting for it,
 * proving it is serving *our* build, and killing it (including the Windows
 * process-tree case).
 *
 * The previous version could hand a sweep a stale build without anyone
 * noticing. It never checked whether port 4173 was already taken, so when an
 * orphaned server from a killed run was still holding it:
 *
 *   - the new vite exited immediately on --strictPort (silently, because
 *     visual_qa passes stdio:'ignore'),
 *   - waitForServer() fetched `/` and got its 200 from the *orphan*,
 *   - start resolved and returned a child that was already dead,
 *   - and the whole sweep ran against whatever dist/ the orphan had loaded.
 *
 * Source digests hash what is on disk, never what was served, so that produced
 * a fully green, digest-bound SHIP_PASS describing a build the browser never
 * saw — the exact failure class the digest work exists to prevent. The port is
 * now probed up front and a busy port is a hard error, and the server is asked
 * to prove it is serving the dist/ we just built.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createConnection } from 'node:net';

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

/** True if something is already listening on the preview port. */
export function isPortBusy(port = PREVIEW_PORT, host = PREVIEW_HOST, timeout = 1000) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host });
    const done = (busy) => {
      socket.destroy();
      resolve(busy);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
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
 * Confirms the running server is serving the dist/ on disk, not some other
 * build. Compares the bytes of `/` against `dist/index.html`.
 */
export async function assertServingDist(root, url = PREVIEW_URL) {
  const indexPath = join(root, 'dist', 'index.html');
  if (!existsSync(indexPath)) return;
  const onDisk = createHash('sha256').update(readFileSync(indexPath)).digest('hex');
  const served = createHash('sha256')
    .update(Buffer.from(await (await fetch(url)).arrayBuffer()))
    .digest('hex');
  if (onDisk !== served) {
    throw new Error(
      `The server on ${url} is not serving this dist/.\n` +
        `  dist/index.html ${onDisk.slice(0, 12)} vs served ${served.slice(0, 12)}\n` +
        '  A stale preview server is running. Stop it and re-run.'
    );
  }
}

/** Servers started in this process, so signal handlers can clean them up. */
const active = new Set();
let handlersInstalled = false;

function installHandlers() {
  if (handlersInstalled) return;
  handlersInstalled = true;
  const cleanup = () => {
    for (const server of [...active]) stopPreviewServer(server);
  };
  // Without these, Ctrl-C left the whole cmd.exe -> npm -> vite tree running
  // and the next run silently adopted it.
  process.on('exit', cleanup);
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
    process.on(signal, () => {
      cleanup();
      process.exit(130);
    });
  }
}

/**
 * Spawns `npm run preview` and resolves once it answers.
 * Returns the child process; pass it to stopPreviewServer() in a finally block.
 *
 * Throws if the port is already in use — adopting an unknown server is how a
 * sweep ends up testing a build nobody made.
 */
export async function startPreviewServer({ stdio = 'inherit', settleMs = 2000, root = process.cwd() } = {}) {
  if (await isPortBusy()) {
    throw new Error(
      `Port ${PREVIEW_PORT} is already in use.\n` +
        '  Another QA sweep is running, or a previous one left an orphaned preview server.\n' +
        '  Windows:  powershell "Get-CimInstance Win32_Process -Filter \\"Name=\'node.exe\'\\" |\n' +
        '              Where-Object { $_.CommandLine -like \'*vite*preview*\' } |\n' +
        '              ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"\n' +
        `  POSIX:    lsof -ti:${PREVIEW_PORT} | xargs kill -9`
    );
  }

  installHandlers();
  const server = spawn(
    'npm',
    ['run', 'preview', '--', '--host', PREVIEW_HOST, '--port', String(PREVIEW_PORT), '--strictPort'],
    // detached on POSIX puts npm and vite in their own process group so the
    // whole group can be signalled; on Windows taskkill /t walks the tree.
    { shell: true, stdio, detached: process.platform !== 'win32' }
  );
  active.add(server);

  try {
    await waitForServer(PREVIEW_URL);
    await assertServingDist(root, PREVIEW_URL);
  } catch (err) {
    stopPreviewServer(server);
    throw err;
  }
  if (settleMs) await new Promise((r) => setTimeout(r, settleMs));
  return server;
}

export function stopPreviewServer(server) {
  if (!server) return;
  active.delete(server);
  if (process.platform === 'win32') {
    // spawnSync, not spawn: both callers do stopPreviewServer() immediately
    // followed by process.exit(), and an async spawn was routinely torn down
    // with the event loop before the kill had even been issued. That is where
    // the orphans came from.
    spawnSync('taskkill', ['/pid', String(server.pid), '/f', '/t'], { stdio: 'ignore' });
  } else {
    try {
      // Negative pid signals the whole process group, so vite dies with the
      // shell that spawned it rather than being reparented to init.
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      try {
        server.kill('SIGTERM');
      } catch {
        /* already gone */
      }
    }
  }
}
