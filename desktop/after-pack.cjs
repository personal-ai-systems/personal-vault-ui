const { cp, access } = require('node:fs/promises');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
module.exports = async context => {
  const appPath=path.join(context.appOutDir,'Personal Vault.app');
  const resources=path.join(appPath,'Contents','Resources');
  for(const name of ['web','vault']) await cp(path.join(context.packager.projectDir,'.desktop-stage',name,'node_modules'),path.join(resources,name,'node_modules'),{recursive:true,dereference:true});
  await access(path.join(resources,'web','node_modules','next','package.json'));
  await access(path.join(resources,'vault','node_modules','@modelcontextprotocol','sdk','package.json'));

  // electron-builder deliberately skips Developer ID signing for local preview
  // builds. The bundled Electron executable still carries a linker signature,
  // so adding resources without sealing the finished app makes macOS report
  // that the app is damaged. Seal the complete local bundle with an ad-hoc
  // signature. Gatekeeper will still require the user's explicit Open Anyway
  // approval; public releases must use Developer ID signing and notarization.
  const developerSigningEnabled = process.env.CSC_IDENTITY_AUTO_DISCOVERY === 'true' || Boolean(process.env.CSC_LINK);
  if (context.electronPlatformName === 'darwin' && !developerSigningEnabled) {
    execFileSync('/usr/bin/codesign', [
      '--force',
      '--deep',
      '--sign', '-',
      '--timestamp=none',
      appPath,
    ], { stdio: 'inherit' });
  }
};
