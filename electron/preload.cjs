const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ping: () => ipcRenderer.invoke('ping'),
  app: {
    checkUpdate: () => ipcRenderer.invoke('app:check-update'),
  },
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
  },
  vault: {
    status: () => ipcRenderer.invoke('vault:status'),
    setup: (password) => ipcRenderer.invoke('vault:setup', password),
    unlock: (password) => ipcRenderer.invoke('vault:unlock', password),
    lock: () => ipcRenderer.invoke('vault:lock'),
    changePassword: (currentPassword, nextPassword) =>
      ipcRenderer.invoke('vault:change-password', currentPassword, nextPassword),
    disablePassword: (currentPassword) => ipcRenderer.invoke('vault:disable-password', currentPassword),
    security: () => ipcRenderer.invoke('vault:security'),
    setSecurity: (payload) => ipcRenderer.invoke('vault:set-security', payload),
    settings: () => ipcRenderer.invoke('vault:settings'),
    setSettings: (partial) => ipcRenderer.invoke('vault:set-settings', partial),
    exportBackup: () => ipcRenderer.invoke('vault:export'),
    importBackup: (filePath, backupPassword, adoptKey) =>
      ipcRenderer.invoke('vault:import', filePath, backupPassword, adoptKey),
  },
  theme: {
    pickFile: () => ipcRenderer.invoke('theme:pick-file'),
    parse: (filename, content) => ipcRenderer.invoke('theme:parse', filename, content),
  },
  widget: {
    list: () => ipcRenderer.invoke('widget:list'),
    listActive: () => ipcRenderer.invoke('widget:list-active'),
    listPassive: () => ipcRenderer.invoke('widget:list-passive'),
    create: (url, options) => ipcRenderer.invoke('widget:create', url, options),
    activate: (id) => ipcRenderer.invoke('widget:activate', id),
    deactivate: (id) => ipcRenderer.invoke('widget:deactivate', id),
    toggleAll: (activate) => ipcRenderer.invoke('widget:toggle-all', activate),
    remove: (id) => ipcRenderer.invoke('widget:remove', id),
    get: (id) => ipcRenderer.invoke('widget:get', id),
    update: (id, updates) => ipcRenderer.invoke('widget:update', id, updates),
    getConfig: (id) => ipcRenderer.invoke('widget:config:get', id),
    setConfig: (id, config) => ipcRenderer.invoke('widget:config:set', id, config),
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
  dialog: {
    openFolder: () => ipcRenderer.invoke('dialog:open-folder'),
    openWidgetSource: () => ipcRenderer.invoke('dialog:open-widget-source'),
  },
});
