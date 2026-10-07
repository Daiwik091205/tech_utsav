const { contextBridge, ipcRenderer } = require('electron');

// Secure Air-Gapped Context Bridge
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,

  // Air-Gapped Mutual Authentication Token
  getEnclaveToken: () => ipcRenderer.invoke('app:get-enclave-token'),
  getBackendUrl: () => ipcRenderer.invoke('app:get-backend-url'),
  getSystemInfo: () => ipcRenderer.invoke('app:get-system-info'),

  // Native Windows File Dialogs
  openFileDialog: () => ipcRenderer.invoke('dialog:open-pdf'),
  saveFileDialog: (params) => ipcRenderer.invoke('dialog:save-file', params),
  showItemInFolder: (filePath) => ipcRenderer.invoke('shell:show-item-in-folder', filePath),

  // Native Window State Controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
});
