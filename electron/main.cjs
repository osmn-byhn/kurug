const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { updateIfNeeded } = require('@osmn-byhn/changelog-github-updater');
// const WidgetManager = require('./widget-manager.cjs');
let WidgetManager;


const isDev = !app.isPackaged;

// Set the application name early so OS shows it instead of "Electron"
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
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// Window controls
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

app.whenReady().then(async () => {
  if (!isDev) {
    updateIfNeeded({
      owner: 'osmn-byhn',
      repo: 'Kurug',
      currentVersion: app.getVersion(),
      autoInstall: false
    }).then(result => {
      if (result && result.updated) {
        console.log(`Update downloaded! ${result.from} -> ${result.to}`);
      }
    }).catch(err => console.error('Auto-updater error:', err));
  }

  const mod = await import('./widget-manager.js');
  WidgetManager = mod.default;
  await WidgetManager.init();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Open folder dialog
ipcMain.handle('dialog:open-folder', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    title: 'Select Widget Folder',
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// App update trigger
ipcMain.handle('app:check-update', async () => {
  if (isDev) return { updated: false };
  
  try {
    const result = await updateIfNeeded({
      owner: 'osmn-byhn',
      repo: 'Kurug',
      currentVersion: app.getVersion(),
      autoInstall: true
    });
    return result || { updated: false };
  } catch (error) {
    console.error('Update check failed:', error);
    return { updated: false };
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
