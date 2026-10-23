// Runs the built standalone Next server with an IPC channel, matching how
// Electron's main process forks it. It logs every main-process message so the
// smoke test can prove the desktop action channel works without opening a window.
import { fork } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const child = fork(path.join(root, '.next/standalone/server.js'), [], {
  cwd: path.join(root, '.next/standalone'),
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
});

// Stand in for main.cjs's onWebServerMessage handler.
child.on('message', (message) => {
  console.log('MAIN_RECEIVED ' + JSON.stringify(message));
  if (message?.type === 'vault:reveal' || message?.type === 'vault:choose') child.send({ type: message.type, handled: true });
});

for (const stream of ['stdout', 'stderr']) child[stream].on('data', (data) => process[stream].write(data));

for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { child.kill(signal); process.exit(0); });
child.on('exit', (code) => process.exit(code ?? 0));
