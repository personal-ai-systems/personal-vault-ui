const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

async function publishConnection(directory, connection) {
  await fsp.mkdir(directory, { recursive: true });
  const target = path.join(directory, 'mcp-connection.json');
  const temporary = `${target}.${process.pid}.tmp`;
  await fsp.writeFile(temporary, JSON.stringify({ version: 1, ...connection }), { mode: 0o600, flag: 'wx' });
  await fsp.rename(temporary, target);
  return target;
}

function removeConnection(target, pid = process.pid) {
  if (!target) return;
  try {
    if (JSON.parse(fs.readFileSync(target, 'utf8')).pid === pid) fs.unlinkSync(target);
  } catch {}
}

function codexCommand(executable, bridge, descriptor) {
  const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
  return `codex mcp add personal_vault --env ELECTRON_RUN_AS_NODE=1 -- ${[executable, bridge, descriptor].map(quote).join(' ')}`;
}

module.exports = { publishConnection, removeConnection, codexCommand };
