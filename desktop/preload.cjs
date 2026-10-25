const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('personalVault', {
  importOpenAI: () => ipcRenderer.invoke('vault:import-openai'),
});
