import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const fixture=await mkdtemp(path.join(tmpdir(),'personal-vault-desktop-test-'));
const appBundle=path.resolve(process.argv[2] || 'dist/mac-arm64/Personal Vault.app');
const executable=path.join(appBundle,'Contents/MacOS/Personal Vault');
async function run(command,args) {
  const child=spawn(command,args,{stdio:['ignore','pipe','pipe']});
  let output='';
  child.stdout.on('data',data=>{output+=data;process.stdout.write(data);});
  child.stderr.on('data',data=>{output+=data;process.stderr.write(data);});
  const code=await new Promise((resolve,reject)=>{child.on('exit',resolve);child.on('error',reject);});
  return {code,output};
}
try {
  const child=spawn(executable,[],{env:{...process.env,PV_DESKTOP_SMOKE_ROOT:fixture,PV_DESKTOP_SMOKE_SHOW:'1'},stdio:['ignore','pipe','pipe']});
  let output='';child.stdout.on('data',data=>{output+=data;process.stdout.write(data);});child.stderr.on('data',data=>process.stderr.write(data));
  const timer=setTimeout(()=>child.kill('SIGTERM'),180000);
  const code=await new Promise((resolve,reject)=>{child.on('exit',resolve);child.on('error',reject);}).finally(()=>clearTimeout(timer));
  assert.equal(code,0);assert.match(output,/DESKTOP_SMOKE_OK/);
  const signature=await run('/usr/bin/codesign',['--verify','--deep','--strict','--verbose=2',appBundle]);
  assert.equal(signature.code,0,`The packaged app changed during its first launch:\n${signature.output}`);
  console.log('DESKTOP_SIGNATURE_OK_AFTER_LAUNCH');
} finally {await rm(fixture,{recursive:true,force:true});}
