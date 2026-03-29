const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Add any IPC handlers here
  ping: () => ipcRenderer.invoke('ping'),
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
  },
  widget: {
    list: () => ipcRenderer.invoke('widget:list'),
    listActive: () => ipcRenderer.invoke('widget:list-active'),
    listPassive: () => ipcRenderer.invoke('widget:list-passive'),
    create: (url, options) => ipcRenderer.invoke('widget:create', url, options),
    activate: (id) => ipcRenderer.invoke('widget:activate', id),
    deactivate: (id) => ipcRenderer.invoke('widget:deactivate', id),
    remove: (id) => ipcRenderer.invoke('widget:remove', id),
    get: (id) => ipcRenderer.invoke('widget:get', id),
    update: (id, updates) => ipcRenderer.invoke('widget:update', id, updates),
    setOpacity: (id, opacity) => ipcRenderer.invoke('widget:set-opacity', id, opacity),
    setPosition: (id, x, y) => ipcRenderer.invoke('widget:set-position', id, x, y),
    setPersistent: (id, value) => ipcRenderer.invoke('widget:set-persistent', id, value),
    makePersistent: (id, options) => ipcRenderer.invoke('widget:make-persistent', id, options),
    stopPersistence: (id) => ipcRenderer.invoke('widget:stop-persistence', id),
    launchStandalone: (id) => ipcRenderer.invoke('widget:launch-standalone', id),
    stopAll: () => ipcRenderer.invoke('widget:stop-all'),
    killAll: () => ipcRenderer.invoke('widget:kill-all'),
    fetch: (id) => ipcRenderer.invoke('widget:fetch', id),
    pull: (id) => ipcRenderer.invoke('widget:pull', id),
    checkUpdate: (id) => ipcRenderer.invoke('widget:check-update', id),
  },
});
