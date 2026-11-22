const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { updateIfNeeded } = require('@osmn-byhn/changelog-github-updater');

let WidgetManager;
let vault;
let parseThemeSource;

const isDev = !app.isPackaged;

app.setName('Kurug');
app.setAppUserModelId('com.kurug.app');

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('class', 'Kurug');
}

function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, '../public/logo.ico')
    : process.platform === 'darwin'
      ? path.join(__dirname, '../public/logo.icns')
      : path.join(__dirname, '../public/logo.png');

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Kurug',
    frame: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173';
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

function setupVaultIpc() {
  ipcMain.handle('vault:status', () => vault.status());
  ipcMain.handle('vault:setup', (_e, password) => vault.setup(password));
  ipcMain.handle('vault:unlock', async (_e, password) => {
    const result = await vault.unlock(password);
    if (result.ok) WidgetManager.resetActiveFlags();
    if (result.wiped) await WidgetManager.stopAllProcesses();
    return result;
  });
  ipcMain.handle('vault:lock', async () => {
    await WidgetManager.stopAllProcesses();
    return vault.lock();
  });
  ipcMain.handle('vault:change-password', (_e, currentPassword, nextPassword) => {
    return vault.changePassword(currentPassword, nextPassword);
  });
  ipcMain.handle('vault:disable-password', (_e, currentPassword) => vault.disablePassword(currentPassword));
  ipcMain.handle('vault:security', () => vault.security());
  ipcMain.handle('vault:set-security', (_e, payload) => vault.setSecurity(payload));
  ipcMain.handle('vault:settings', () => vault.getAppSettings());
  ipcMain.handle('vault:set-settings', (_e, partial) => vault.setAppSettings(partial));

  ipcMain.handle('vault:export', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const stamp = new Date().toISOString().slice(0, 10);
    const result = await dialog.showSaveDialog(win, {
      title: 'Export encrypted backup',
      defaultPath: `kurug-backup-${stamp}.kurugbak`,
      filters: [{ name: 'Kurug Backup', extensions: ['kurugbak'] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    vault.writeBackupFile(result.filePath);
    return { canceled: false, path: result.filePath };
  });

  ipcMain.handle('vault:import', async (event, filePath, backupPassword, adoptKey) => {
    let target = filePath;
    if (!target) {
      const win = BrowserWindow.fromWebContents(event.sender);
      const result = await dialog.showOpenDialog(win, {
        title: 'Import Kurug backup',
        properties: ['openFile'],
        filters: [{ name: 'Kurug Backup', extensions: ['kurugbak', 'json'] }],
      });
      if (result.canceled || result.filePaths.length === 0) return { canceled: true };
      target = result.filePaths[0];
    }
    await WidgetManager.stopAllProcesses();
    const imported = vault.importBackup(target, backupPassword, { adoptKey: adoptKey !== false });
    WidgetManager.resetActiveFlags();
    return { canceled: false, ...imported };
  });

  ipcMain.handle('theme:pick-file', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      title: 'Import theme',
      properties: ['openFile'],
      filters: [
        { name: 'Themes', extensions: ['tdesktop-theme', 'tdesktop-palette', 'attheme', 'kurug-theme', 'json', 'css'] },
        { name: 'All files', extensions: ['*'] },
      ],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = parseThemeSource(path.basename(filePath), content);
    return { path: filePath, name: path.basename(filePath), ...parsed };
  });

  ipcMain.handle('theme:parse', (_e, filename, content) => parseThemeSource(filename, content));
}

app.whenReady().then(async () => {
  if (!isDev) {
    updateIfNeeded({
      owner: 'osmn-byhn',
      repo: 'Kurug',
      currentVersion: app.getVersion(),
      autoInstall: false,
    }).then((result) => {
      if (result && result.updated) {
        console.log(`Update downloaded! ${result.from} -> ${result.to}`);
      }
    }).catch((err) => console.error('Auto-updater error:', err));
  }

  const vaultMod = await import('./vault.mjs');
  vault = vaultMod.default;
  await vault.init();

  const themeMod = await import('./theme-parser.mjs');
  parseThemeSource = themeMod.parseThemeSource;

  const mod = await import('./widget-manager.js');
  WidgetManager = mod.default;
  await WidgetManager.init();
  if (vault.isUnlocked) WidgetManager.resetActiveFlags();
  setupVaultIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

ipcMain.handle('dialog:open-folder', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    title: 'Select folder',
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('dialog:open-widget-source', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'openDirectory'],
    title: 'Select widget file or project folder',
    filters: [{ name: 'Web files', extensions: ['html', 'htm'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('app:check-update', async () => {
  if (isDev) return { updated: false };

  try {
    const result = await updateIfNeeded({
      owner: 'osmn-byhn',
      repo: 'Kurug',
      currentVersion: app.getVersion(),
      autoInstall: true,
    });
    return result || { updated: false };
  } catch (error) {
    console.error('Update check failed:', error);
    return { updated: false };
  }
});

app.on('before-quit', () => {
  if (vault && vault.isUnlocked) {
    try { vault.flush(); } catch { /* ignore */ }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
