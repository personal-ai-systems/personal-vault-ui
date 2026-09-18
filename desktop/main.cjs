const { app, BrowserWindow, dialog, Menu } = require('electron');
const { fork } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const net = require('node:net');
const { randomBytes } = require('node:crypto');
let window, children = [], quitting = false;
const token = randomBytes(32).toString('hex');
async function port() {
  const server = net.createServer();
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const value = server.address().port;
  await new Promise(resolve=>server.close(resolve));
  return value;
}
async function ready(url, headers = {}) {
  for (let i=0;i<300;i++) {
    try { const r=await fetch(url,{headers,signal:AbortSignal.timeout(1000)});if(r.ok)return; } catch {}
    await new Promise(r=>setTimeout(r,100));
  }
  throw Error('The local service did not start.');
}
function start(script, env) {
  const child = fork(script,[],{execPath:process.execPath,cwd:path.dirname(script),env:{...process.env,...env,ELECTRON_RUN_AS_NODE:'1'},stdio:['ignore','pipe','pipe','ipc']});
  // Do not record user file contents or paths in a persistent log.
  child.stderr.on('data',data=>console.error(String(data)));
  child.on('error',error=>{if(!quitting)dialog.showErrorBox('Personal Vault',error.message);});
  child.on('exit',code=>{if(!quitting){console.error('Service exited',code);if(!process.env.PV_DESKTOP_SMOKE_ROOT)dialog.showErrorBox('Personal Vault','A local service stopped unexpectedly. Please restart the app.');app.quit();}});
  children.push(child);
}
async function boot() {
  const configFile=path.join(app.getPath('userData'),'settings.json');
  let root;
  if (process.env.PV_DESKTOP_SMOKE_ROOT) root=process.env.PV_DESKTOP_SMOKE_ROOT;
  else {
    try { root=JSON.parse(await fs.readFile(configFile,'utf8')).vaultRoot;await fs.access(root); } catch {root=null;}
    if (!root) {
      const selected=await dialog.showOpenDialog({title:'Choose or create your Vault folder',properties:['openDirectory','createDirectory']});
      if(selected.canceled){app.quit();return;}
      root=selected.filePaths[0];
      await fs.mkdir(path.dirname(configFile),{recursive:true});
      await fs.writeFile(configFile,JSON.stringify({vaultRoot:root},null,2));
    }
  }
  root=await fs.realpath(root);
  const resources=app.isPackaged ? process.resourcesPath : path.join(__dirname,'..','.desktop-stage');
  const backendPort=await port(),uiPort=await port();
  const backendURL=`http://127.0.0.1:${backendPort}`;
  const uiURL=`http://127.0.0.1:${uiPort}`;
  start(path.join(resources,'vault','mcp','personal-vault-server.mjs'),{PERSONAL_VAULT_ROOT:root,MCP_HOST:'127.0.0.1',MCP_PORT:String(backendPort),PERSONAL_VAULT_TOKEN:token});
  await ready(backendURL+'/status',{Authorization:`Bearer ${token}`});
  start(path.join(resources,'web','server.js'),{NODE_ENV:'production',HOSTNAME:'127.0.0.1',PORT:String(uiPort),PERSONAL_VAULT_ROOT:root,PERSONAL_VAULT_MCP_URL:backendURL+'/mcp',PERSONAL_VAULT_TOKEN:token,PERSONAL_VAULT_UI_TOKEN:token,NEXT_TELEMETRY_DISABLED:'1'});
  await ready(uiURL+'/api/files',{'x-vault-desktop-token':token});
  window=new BrowserWindow({width:1200,height:850,show:!process.env.PV_DESKTOP_SMOKE_ROOT,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
  window.webContents.session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  window.webContents.session.webRequest.onBeforeSendHeaders({urls:[uiURL+'/*']},(details,callback)=>callback({requestHeaders:{...details.requestHeaders,'x-vault-desktop-token':token}}));
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==uiURL)event.preventDefault();});
  Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'Personal Vault',submenu:[{label:'Choose another Vault…',click:async()=>{await fs.rm(configFile,{force:true});app.relaunch();app.quit();}},{role:'quit'}]},{role:'editMenu'},{role:'viewMenu'}]));
  await window.loadURL(uiURL);
  if(process.env.PV_DESKTOP_SMOKE_ROOT){
    const assert=require('node:assert/strict');
    assert.equal((await fetch(uiURL+'/api/files')).status,401);
    assert.equal((await fetch(backendURL+'/status')).status,401);
    assert.equal((await fetch(uiURL+'/api/today',{headers:{'x-vault-desktop-token':token}})).status,404);
    const invoke=async(operation,args)=>{
      const r=await fetch(uiURL+'/api/vault',{method:'POST',headers:{'Content-Type':'application/json','x-vault-desktop-token':token},body:JSON.stringify({operation,args})});
      const data=await r.json();assert.equal(r.ok,true,JSON.stringify(data));return data;
    };
    const file='raw/desktop-smoke.md';
    await invoke('create',{path:file,content:'# Desktop smoke'});
    await invoke('update',{path:file,content:'# Edited desktop smoke'});
    await invoke('attach',{markdownPath:file,name:'sample.txt',dataBase64:Buffer.from('sample').toString('base64')});
    const archived=await invoke('archive',{path:file});
    await invoke('restore',{path:archived.to});
    assert.equal(await fs.readFile(path.join(root,file),'utf8'),'# Edited desktop smoke');
    assert.equal(await fs.readFile(path.join(root,'raw/desktop-smoke.assets/sample.txt'),'utf8'),'sample');
    const search=await fetch(uiURL+'/api/search?q=Edited',{headers:{'x-vault-desktop-token':token}}).then(r=>r.json());
    assert.equal(search.results[0].relativePath,file);
    const title=await window.webContents.executeJavaScript('document.title');
    assert.equal(title,'Personal Vault');
    console.log('DESKTOP_SMOKE_OK: packaged window, UI -> MCP -> files, create/update/attach/search/archive/restore, auth');app.quit();
  }
}
if(process.env.PV_DESKTOP_SMOKE_ROOT) app.setPath('userData',path.join(process.env.PV_DESKTOP_SMOKE_ROOT,'.smoke-user-data'));
if(!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance',()=>{if(window){window.restore();window.focus();}});
  app.whenReady().then(boot).catch(error=>{console.error(error);if(!process.env.PV_DESKTOP_SMOKE_ROOT)dialog.showErrorBox('Personal Vault could not start',error.message);app.quit();});
}
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>{quitting=true;for(const child of children)child.kill('SIGTERM');});
