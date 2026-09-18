const { cp, access } = require('node:fs/promises');
const path = require('node:path');
module.exports = async context => {
  const resources=path.join(context.appOutDir,'Personal Vault.app','Contents','Resources');
  for(const name of ['web','vault']) await cp(path.join(context.packager.projectDir,'.desktop-stage',name,'node_modules'),path.join(resources,name,'node_modules'),{recursive:true,dereference:true});
  await access(path.join(resources,'web','node_modules','next','package.json'));
  await access(path.join(resources,'vault','node_modules','@modelcontextprotocol','sdk','package.json'));
};
