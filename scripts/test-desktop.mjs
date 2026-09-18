import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const fixture=await mkdtemp(path.join(tmpdir(),'personal-vault-desktop-test-'));
const executable=path.resolve('dist/mac-arm64/Personal Vault.app/Contents/MacOS/Personal Vault');
try {
  const child=spawn(executable,[],{env:{...process.env,PV_DESKTOP_SMOKE_ROOT:fixture},stdio:['ignore','pipe','pipe']});
  let output='';child.stdout.on('data',data=>{output+=data;process.stdout.write(data);});child.stderr.on('data',data=>process.stderr.write(data));
  const timer=setTimeout(()=>child.kill('SIGTERM'),90000);
  const code=await new Promise((resolve,reject)=>{child.on('exit',resolve);child.on('error',reject);}).finally(()=>clearTimeout(timer));
  assert.equal(code,0);assert.match(output,/DESKTOP_SMOKE_OK/);
} finally {await rm(fixture,{recursive:true,force:true});}
