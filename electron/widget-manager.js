import { app, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { exec, spawn } from 'child_process';
import { JSONFilePreset } from 'lowdb/node';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class WidgetManager {
  constructor() {
    this.db = null;
    this.registryPath = path.join(app.getPath('userData'), 'widgets-low.json');
    this.widgetsDir = path.join(app.getPath('userData'), 'widgets');
  }

  async init() {
    // Ensure widgets directory exists
    if (!fs.existsSync(this.widgetsDir)) {
      fs.mkdirSync(this.widgetsDir, { recursive: true });
    }

    // Initialize lowdb
    const defaultData = { widgets: [] };
    this.db = await JSONFilePreset(this.registryPath, defaultData);

    this.setupIpc();

    // Reset all active states on startup — no processes are running yet
    const hadActive = this.db.data.widgets.some(w => w.active);
    if (hadActive) {
      this.db.data.widgets.forEach(w => { w.active = false; });
      await this.db.write();
    }

    console.log('WidgetManager initialized. Auto-activation is disabled.');
  }

  setupIpc() {
    ipcMain.handle('widget:list', () => this.db.data.widgets);
    ipcMain.handle('widget:list-active', () => this.db.data.widgets.filter(w => !!w.active));
    ipcMain.handle('widget:list-passive', () => this.db.data.widgets.filter(w => !w.active));
    
    ipcMain.handle('widget:create', async (event, source, options) => {
      return await this.create(source, options);
    });

    ipcMain.handle('widget:get', (event, id) => {
      return this.db.data.widgets.find(w => w.id.toString() === id.toString());
    });

    ipcMain.handle('widget:update', async (event, id, updates) => {
      const index = this.db.data.widgets.findIndex(w => w.id.toString() === id.toString());
      if (index !== -1) {
        this.db.data.widgets[index] = { ...this.db.data.widgets[index], ...updates };
        await this.db.write();
        return this.db.data.widgets[index];
      }
      throw new Error('Widget not found');
    });

    ipcMain.handle('widget:activate', async (event, id) => {
      return await this.activate(id);
    });

    ipcMain.handle('widget:deactivate', async (event, id) => {
      return await this.deactivate(id);
    });

    ipcMain.handle('widget:remove', async (event, id) => {
      return await this.remove(id);
    });
    
    ipcMain.handle('widget:fetch', async (event, id) => {
      return await this.fetch(id);
    });

    ipcMain.handle('widget:pull', async (event, id) => {
      return await this.pull(id);
    });

    ipcMain.handle('widget:check-update', async (event, id) => {
      return await this.checkUpdate(id);
    });
  }

  async create(source, options = {}) {
    const id = Date.now().toString();
    let widgetPath = source;
    let type = 'url';

    if (source.includes('github.com') || source.includes('gitlab.com') || source.includes('bitbucket.org')) {
      type = 'git';
      const repoName = source.split('/').pop().replace('.git', '');
      widgetPath = path.join(this.widgetsDir, `${repoName}-${id}`);
      
      await new Promise((resolve, reject) => {
        exec(`git clone ${source} "${widgetPath}"`, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    } else if (fs.existsSync(source)) {
      type = 'local';
      widgetPath = source;
    }

    const newWidget = {
      id,
      name: options.name || (type === 'git' ? path.basename(widgetPath) : source),
      type,
      source,
      path: widgetPath,
      active: false,
      options: {
        width: options.width || 400,
        height: options.height || 300,
        x: options.x || 100,
        y: options.y || 100,
        transparent: true,
        frame: false,
        ...options
      }
    };

    this.db.data.widgets.push(newWidget);
    await this.db.write();
    return newWidget;
  }

  async activate(id) {
    const widgetData = this.db.data.widgets.find(w => w.id.toString() === id.toString());
    if (!widgetData) throw new Error('Widget not found');

    try {
      let url = widgetData.path;
      if (widgetData.type !== 'url' && !url.startsWith('http')) {
        const indexPath = path.join(url, 'index.html');
        if (fs.existsSync(indexPath)) {
          url = `file://${indexPath}`;
        } else {
          url = `file://${url}`;
        }
      }

      const invokerPath = path.join(__dirname, 'widget-invoker.mjs');
      const optionsJson = JSON.stringify(widgetData.options);
      
      const child = spawn('node', [invokerPath, 'activate', id, url, optionsJson], {
        stdio: 'inherit'
      });

      // Update state immediately in DB
      widgetData.active = true;
      await this.db.write();

      return { success: true };
    } catch (e) {
      console.error('Failed to activate widget:', e);
      throw e;
    }
  }

  async deactivate(id) {
    const widgetData = this.db.data.widgets.find(w => w.id.toString() === id.toString());
    if (!widgetData) throw new Error('Widget not found');

    try {
      const invokerPath = path.join(__dirname, 'widget-invoker.mjs');
      let url = widgetData.path;
      if (widgetData.type !== 'url' && !url.startsWith('http')) {
        const indexPath = path.join(url, 'index.html');
        url = fs.existsSync(indexPath) ? `file://${indexPath}` : `file://${url}`;
      }

      await new Promise((resolve) => {
        const child = spawn('node', [invokerPath, 'deactivate', id, url], {
          stdio: 'inherit'
        });
        child.on('exit', () => resolve());
        child.on('error', () => resolve());
      });

      // Update state after deactivation is processed
      widgetData.active = false;
      await this.db.write();
      return { success: true };
    } catch (e) {
      console.error('Failed to deactivate widget:', e);
      throw e;
    }
  }

  async remove(id) {
    await this.deactivate(id);
    const index = this.db.data.widgets.findIndex(w => w.id.toString() === id.toString());
    if (index !== -1) {
      this.db.data.widgets.splice(index, 1);
      await this.db.write();
    }
    return { success: true };
  }

  async fetch(id) {
    const widget = this.db.data.widgets.find(w => w.id === id);
    if (!widget || widget.type !== 'git') throw new Error('Not a git widget');

    return new Promise((resolve, reject) => {
      exec('git fetch', { cwd: widget.path }, (error, stdout, stderr) => {
        if (error) reject(new Error(stderr || error.message));
        else resolve({ success: true, output: stdout });
      });
    });
  }

  async pull(id) {
    const widget = this.db.data.widgets.find(w => w.id === id);
    if (!widget || widget.type !== 'git') throw new Error('Not a git widget');

    return new Promise((resolve, reject) => {
      exec('git pull', { cwd: widget.path }, (error, stdout, stderr) => {
        if (error) reject(new Error(stderr || error.message));
        else resolve({ success: true, output: stdout });
      });
    });
  }

  async checkUpdate(id) {
    const widget = this.db.data.widgets.find(w => w.id === id);
    if (!widget || widget.type !== 'git') throw new Error('Not a git widget');

    return new Promise((resolve, reject) => {
      // First fetch to get latest remote state
      exec('git fetch', { cwd: widget.path }, (fetchErr) => {
        if (fetchErr) return reject(new Error('Fetch failed: ' + fetchErr.message));

        // Compare local HEAD with upstream
        exec('git rev-list HEAD...@{u} --count', { cwd: widget.path }, (err, stdout) => {
          if (err) return reject(new Error('Revision check failed: ' + err.message));
          
          const count = parseInt(stdout.trim(), 10);
          resolve({ hasUpdate: count > 0, count });
        });
      });
    });
  }
}

export default new WidgetManager();
