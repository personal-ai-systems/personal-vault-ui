// Builds the Personal Vault desktop app for Apple Silicon.
//
// The Vault is not copied into this app by hand any more. build-desktop used to
// copy mcp/personal-vault-server.mjs out of a sibling checkout, which meant the
// packaged server had no version: it was whatever happened to be on disk, and
// nothing failed when the two drifted apart. That is how a refactor of the
// server left the app shipping a file that could not import its own library.
//
// Now desktop/vault-dependency.json pins one commit, the build installs it as a
// real npm dependency into .desktop-stage/vault/node_modules, and three checks
// run before anything is packaged:
//   1. the local checkout is at the pinned commit and is clean
//   2. the installed package resolves and loads through its exports map
//   3. the installed server actually starts and answers /status
// A failure in any of them stops the build instead of producing an app that
// crashes on launch.

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stage = path.join(root, '.desktop-stage');
const vaultCheckout = path.resolve(process.env.PERSONAL_VAULT_SOURCE || path.join(root, '..', 'personal-vault'));

function run(command, args, cwd = root) {
  const r = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', CSC_IDENTITY_AUTO_DISCOVERY: process.env.CSC_IDENTITY_AUTO_DISCOVERY ?? 'false' },
  });
  if (r.status !== 0) throw Error(`${command} ${args.join(' ')} failed: ${r.status}`);
}

function capture(command, args, cwd) {
  const r = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw Error(`${command} ${args.join(' ')} failed: ${r.stderr || r.status}`);
  return r.stdout.trim();
}

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

// Starts the installed server exactly as the app will, against a throwaway root,
// and requires a real answer from /status. Catches a missing import, a bad
// package layout, or a dependency that did not install.
async function probeInstalledServer(serverScript) {
  const vaultRoot = await mkdtemp(path.join(tmpdir(), 'personal-vault-build-probe-'));
  const port = await freePort();
  const child = spawn(process.execPath, [serverScript], {
    cwd: path.dirname(serverScript),
    env: { ...process.env, PERSONAL_VAULT_ROOT: vaultRoot, MCP_HOST: '127.0.0.1', MCP_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (data) => { stderr += String(data); });
  try {
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw Error(`The installed Vault server exited with ${child.exitCode}:\n${stderr}`);
      try {
        const response = await fetch(`http://127.0.0.1:${port}/status`, { signal: AbortSignal.timeout(1000) });
        if (response.ok) {
          const status = await response.json();
          if (status.server !== 'personal-vault') throw Error(`Unexpected server name in /status: ${JSON.stringify(status)}`);
          return status;
        }
      } catch (error) { if (error.message?.startsWith('Unexpected server name')) throw error; }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw Error(`The installed Vault server never answered /status:\n${stderr}`);
  } finally {
    child.kill('SIGKILL');
    await rm(vaultRoot, { recursive: true, force: true });
  }
}

if (process.platform !== 'darwin' || process.arch !== 'arm64') throw Error('Build this initial version on an Apple Silicon Mac.');

// ---------------------------------------------------------------- the pin

const pin = JSON.parse(await readFile(path.join(root, 'desktop', 'vault-dependency.json'), 'utf8'));
if (!pin.ref) throw Error('desktop/vault-dependency.json must pin a ref.');

const hasCheckout = spawnSync('git', ['-C', vaultCheckout, 'rev-parse', 'HEAD']).status === 0;
if (hasCheckout) {
  const head = capture('git', ['rev-parse', 'HEAD'], vaultCheckout);
  if (head !== pin.ref) {
    throw Error([
      `The Vault checkout is at ${head.slice(0, 12)} but the app pins ${pin.ref.slice(0, 12)}.`,
      `Update desktop/vault-dependency.json to the commit you intend to ship, or check out that commit.`,
      `The pin exists so the app cannot silently ship a different server than the one you tested.`,
    ].join('\n'));
  }
  const dirty = capture('git', ['status', '--porcelain'], vaultCheckout);
  if (dirty && process.env.PERSONAL_VAULT_ALLOW_DIRTY !== '1') {
    throw Error([
      'The Vault checkout has uncommitted changes:',
      dirty,
      '',
      'npm installs the pinned commit, not your working tree, so those changes would not be in the app.',
      'Commit them, or set PERSONAL_VAULT_ALLOW_DIRTY=1 if you are certain they are irrelevant.',
    ].join('\n'));
  }
}

// A local checkout installs offline; another machine uses the declared remote.
// Both resolve to the same commit, so the packaged bytes are the same.
const dependency = process.env.PERSONAL_VAULT_DEPENDENCY
  || (hasCheckout ? `git+file://${vaultCheckout}#${pin.ref}` : `${pin.remote}#${pin.ref}`);

console.log(`Pinned Personal Vault: ${pin.ref.slice(0, 12)} from ${hasCheckout ? 'local checkout' : pin.remote}`);

// Validate the pinned server before staging it.
if (hasCheckout) run('npm', ['test'], vaultCheckout);
run('npm', ['run', 'build']);

// ------------------------------------------------------------- web runtime

await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });
await mkdir(path.join(stage, 'vault'), { recursive: true });
await cp(path.join(root, '.next/standalone'), path.join(stage, 'web'), {
  recursive: true,
  filter: (source) => !['.env', '.env.local', '.env.production', '.env.production.local'].includes(path.basename(source)),
});
await cp(path.join(root, '.next/static'), path.join(stage, 'web/.next/static'), { recursive: true });
await cp(path.join(root, 'public'), path.join(stage, 'web/public'), { recursive: true });

// ------------------------------------------------------------- vault runtime
//
// .desktop-stage/vault is a tiny npm project whose only job is to hold the
// pinned package and its dependencies. Nothing is copied by hand: whatever
// exists in node_modules/personal-vault is what npm resolved from the pin.

const appPackage = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
await writeFile(path.join(stage, 'vault', 'package.json'), `${JSON.stringify({
  name: 'personal-vault-desktop-runtime',
  version: appPackage.version,
  private: true,
  description: 'Runtime dependencies for the bundled Personal Vault server. Generated by scripts/build-desktop.mjs.',
  dependencies: { 'personal-vault': dependency },
}, null, 2)}\n`);
run('npm', ['install', '--omit=dev', '--no-audit', '--no-fund'], path.join(stage, 'vault'));

const installedDir = path.join(stage, 'vault', 'node_modules', 'personal-vault');
const installedServer = path.join(installedDir, 'mcp', 'personal-vault-server.mjs');
const installedLib = path.join(installedDir, 'lib', 'index.mjs');

// Check 1: the library exists. Its absence is the exact failure this rewrite
// exists to prevent, so it gets its own message.
try { await readFile(installedLib); }
catch { throw Error(`The installed package has no lib/index.mjs. The pin ${pin.ref.slice(0, 12)} predates the shared library.`); }

// Check 2: the package resolves through its exports map and the library loads.
const loadCheck = spawnSync(process.execPath, ['--input-type=module', '-e', "import('personal-vault').then(m=>console.log(typeof m.createVault))"], {
  cwd: path.join(stage, 'vault'), encoding: 'utf8',
});
if (loadCheck.status !== 0 || !loadCheck.stdout.includes('function')) {
  throw Error(`The installed package does not export createVault:\n${loadCheck.stderr || loadCheck.stdout}`);
}

// Check 3: the server starts and answers. This is the check that would have
// caught the broken copy that shipped a file unable to import its own library.
const status = await probeInstalledServer(installedServer);

const installedVersion = JSON.parse(await readFile(path.join(installedDir, 'package.json'), 'utf8')).version;
const vaultInfo = {
  ref: pin.ref,
  dependency,
  packageVersion: installedVersion,
  serverVersion: status.version,
  files: {
    'mcp/personal-vault-server.mjs': await sha256(installedServer),
    'lib/index.mjs': await sha256(installedLib),
  },
};
console.log(`Vault runtime ready: package ${installedVersion}, server ${status.version}`);

const developerSigningEnabled = process.env.CSC_IDENTITY_AUTO_DISCOVERY === 'true' || Boolean(process.env.CSC_LINK);
await writeFile(path.join(stage, 'build-info.json'), `${JSON.stringify({
  platform: 'darwin',
  arch: 'arm64',
  builtAt: new Date().toISOString(),
  signed: developerSigningEnabled,
  vault: vaultInfo,
}, null, 2)}\n`);

if (!process.argv.includes('--stage-only')) {
  run('npx', ['--no-install', 'electron-builder', '--mac', '--arm64', ...(process.argv.includes('--dir') ? ['--dir'] : [])]);
  run('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', path.join(root, 'dist', 'mac-arm64', 'Personal Vault.app')]);
}
