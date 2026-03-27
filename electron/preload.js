import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // Add any IPC handlers here
  ping: () => ipcRenderer.invoke('ping'),
});
