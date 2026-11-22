import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { execFile, spawn } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
import vault from './vault.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function execFileAsync(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 120000, ...options }, (error, stdout, stderr) => {
      if (error) reject(new Error((stderr && String(stderr).trim()) || error.message));
      else resolve({ stdout: String(stdout), stderr: String(stderr) });
    });
  });
}

class WidgetManager {
  constructor() {
    this.widgetsDir = null;
  }

  async init() {
    this.widgetsDir = vault.widgetsDir;
    this.setupIpc();
  }

  get widgets() {
    return vault.data?.widgets || [];
  }

  persist() {
    vault.schedulePersist();
  }

  requireUnlocked() {
    if (!vault.isUnlocked) throw new Error('Vault is locked');
  }

  setupIpc() {
    ipcMain.handle('widget:list', () => {
      this.requireUnlocked();
      return this.widgets;
    });
    ipcMain.handle('widget:list-active', () => {
      this.requireUnlocked();
      return this.widgets.filter((w) => !!w.active);
    });
    ipcMain.handle('widget:list-passive', () => {
      this.requireUnlocked();
      return this.widgets.filter((w) => !w.active);
    });

    ipcMain.handle('widget:create', async (_event, source, options) => this.create(source, options));
    ipcMain.handle('widget:get', (_event, id) => {
      this.requireUnlocked();
      return this.widgets.find((w) => w.id.toString() === id.toString()) || null;
    });
    ipcMain.handle('widget:update', async (_event, id, updates) => this.update(id, updates));
    ipcMain.handle('widget:config:get', async (_event, id) => this.getConfig(id));
    ipcMain.handle('widget:config:set', async (_event, id, config) => this.setConfig(id, config));
    ipcMain.handle('widget:activate', async (_event, id) => this.activate(id));
    ipcMain.handle('widget:deactivate', async (_event, id) => this.deactivate(id));
    ipcMain.handle('widget:toggle-all', async (_event, activate) => this.toggleAll(activate));
    ipcMain.handle('widget:remove', async (_event, id) => this.remove(id));
    ipcMain.handle('widget:fetch', async (_event, id) => this.fetch(id));
    ipcMain.handle('widget:pull', async (_event, id) => this.pull(id));
    ipcMain.handle('widget:check-update', async (_event, id) => this.checkUpdate(id));

  }

  findWidget(id) {
    return this.widgets.find((w) => w.id.toString() === id.toString());
  }

  configPath(id) {
    const widget = this.findWidget(id);
    if (widget && ['local', 'git'].includes(widget.type) && widget.path && !/^https?:\/\//i.test(widget.path)) {
      const sourcePath = path.resolve(widget.path);
      const basePath = fs.existsSync(sourcePath) && fs.statSync(sourcePath).isDirectory() ? sourcePath : path.dirname(sourcePath);
      return path.join(basePath, 'config.json');
    }
    return path.join(this.widgetsDir, 'configs', `${String(id).replace(/[^a-zA-Z0-9_-]/g, '')}.json`);
  }

  async getConfig(id) {
    this.requireUnlocked();
    if (!this.findWidget(id)) throw new Error('Widget not found');
    const configPath = this.configPath(id);
    if (!fs.existsSync(configPath)) {
      const defaults = { css: {}, env: {}, widget: {}, js: {} };
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
      fs.writeFileSync(configPath, `${JSON.stringify(defaults, null, 2)}\n`, 'utf8');
      return defaults;
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { ...parsed, css: parsed.css || {}, env: parsed.env || {}, widget: parsed.widget || {}, js: parsed.js || {} };
    }
    catch { throw new Error('Widget JSON config is invalid'); }
  }

  async setConfig(id, config) {
    this.requireUnlocked();
    if (!this.findWidget(id)) throw new Error('Widget not found');
    if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Config must be a JSON object');
    for (const key of ['css', 'js', 'env', 'widget']) {
      const value = config[key];
      if (value !== undefined && typeof value !== 'string' && (!value || typeof value !== 'object' || Array.isArray(value))) {
        throw new Error(`${key} must be a string or key/value object`);
      }
      if (value && typeof value === 'object' && Object.values(value).some((entry) => typeof entry !== 'string')) {
        throw new Error(`${key} values must be strings`);
      }
    }
    const configPath = this.configPath(id);
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    const normalized = { css: config.css ?? {}, env: config.env ?? {}, widget: config.widget ?? {}, js: config.js ?? {} };
    fs.writeFileSync(configPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
    return normalized;
  }

  async create(source, options = {}) {
    this.requireUnlocked();
    const id = Date.now().toString();
    let widgetPath = source;
    let type = 'url';

    const gitHost = /github\.com|gitlab\.com|bitbucket\.org/i.test(source);
    if (gitHost) {
      type = 'git';
      const repoName = source.split('/').pop().replace(/\.git$/, '');
      widgetPath = path.join(this.widgetsDir, `${repoName}-${id}`);
      await execFileAsync('git', ['clone', '--depth', '1', source, widgetPath]);
    } else if (fs.existsSync(source)) {
      type = 'local';
      widgetPath = source;
    }

    const {
      name,
      width,
      height,
      x,
      y,
      ...rest
    } = options;

    const newWidget = {
      id,
      name: name || (type === 'git' ? path.basename(widgetPath) : source),
      type,
      source,
      path: widgetPath,
      active: false,
      options: {
        width: width || 400,
        height: height || 300,
        x: x || 100,
        y: y || 100,
        transparent: true,
        frame: false,
        ...rest,
      },
    };

    this.widgets.push(newWidget);
    const configPath = this.configPath(id);
    if (!fs.existsSync(configPath)) {
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
      fs.writeFileSync(configPath, `${JSON.stringify({ css: {}, env: {}, widget: {}, js: {} }, null, 2)}\n`, 'utf8');
    }
    this.persist();
    return newWidget;
  }

  async update(id, updates) {
    this.requireUnlocked();
    const index = this.widgets.findIndex((w) => w.id.toString() === id.toString());
    if (index === -1) throw new Error('Widget not found');
    this.widgets[index] = { ...this.widgets[index], ...updates };
    this.persist();
    return this.widgets[index];
  }

  widgetUrl(widgetData) {
    let url = widgetData.path;
    if (widgetData.type !== 'url' && !url.startsWith('http')) {
      if (fs.existsSync(url) && fs.statSync(url).isFile()) {
        return pathToFileURL(url).href;
      }
      const indexPath = path.join(url, 'index.html');
      url = fs.existsSync(indexPath) ? pathToFileURL(indexPath).href : pathToFileURL(url).href;
    }
    return url;
  }

  configuredWidgetUrl(widgetData, config) {
    const { css = {}, js = {}, env = {}, widget = {} } = config || {};
    if (![css, js, env, widget].some((section) => section && Object.keys(section).length)) return this.widgetUrl(widgetData);
    let sourceHtml = '';
    if (!sourceHtml && widgetData.type !== 'url') {
      const sourcePath = fs.existsSync(widgetData.path) && fs.statSync(widgetData.path).isDirectory()
        ? path.join(widgetData.path, 'index.html') : widgetData.path;
      if (fs.existsSync(sourcePath) && fs.statSync(sourcePath).isFile()) sourceHtml = fs.readFileSync(sourcePath, 'utf8');
    }
    if (sourceHtml && ['local', 'git'].includes(widgetData.type) && fs.existsSync(widgetData.path)) {
      const sourcePath = fs.statSync(widgetData.path).isDirectory() ? path.join(widgetData.path, 'index.html') : widgetData.path;
      const baseHref = pathToFileURL(`${path.dirname(sourcePath)}${path.sep}`).href;
      const baseTag = `<base href="${baseHref.replace(/"/g, '&quot;')}">`;
      if (/<base\b[^>]*>/i.test(sourceHtml)) sourceHtml = sourceHtml.replace(/<base\b[^>]*>/i, baseTag);
      else if (/<head\b[^>]*>/i.test(sourceHtml)) sourceHtml = sourceHtml.replace(/<head\b[^>]*>/i, `$&${baseTag}`);
    }
    if (!sourceHtml) {
      const target = this.widgetUrl(widgetData);
      sourceHtml = `<!doctype html><html><head><meta charset="utf-8"><style>html,body,iframe{margin:0;width:100%;height:100%;border:0;overflow:hidden}</style></head><body><iframe src="${target.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" allow="fullscreen"></iframe></body></html>`;
    }
    const bootConfig = JSON.stringify({ css, js, env, widget }).replace(/</g, '\\u003c');
    const bootScript = `(function(c){window.widgetConfig=c;window.widgetEnv=c.env||{};var cssVars={controlBackground:'--control-background',selectBackground:'--select-background',dateBackground:'--date-background',controlBorderColor:'--control-border'};Object.entries(c.css||{}).forEach(function(entry){if(cssVars[entry[0]])document.documentElement.style.setProperty(cssVars[entry[0]],entry[1]);});Object.entries(c.js||{}).forEach(function(entry){window[entry[0]]=entry[1];});function apply(){var root=document.querySelector('#widget')||document.body||document.documentElement;Object.entries(c.css||{}).forEach(function(entry){var key=entry[0],value=entry[1],frame=document.querySelector('iframe');if(cssVars[key]){document.documentElement.style.setProperty(cssVars[key],value);return;}if(key==='iframeOverflow'){if(frame)frame.style.overflow=value;return;}if(key==='pageScroll'){document.documentElement.style.overflowY=value;document.body.style.overflowY=value;return;}if(key==='appPadding'){var app=document.getElementById('app');if(app)app.style.padding=value;return;}var property=({textSize:'fontSize',textColor:'color'})[key]||key;if(property in root.style)root.style[property]=value;else document.querySelectorAll(key).forEach(function(node){node.style.cssText+=value;});});Object.entries(c.widget||{}).forEach(function(entry){var key=entry[0],value=entry[1],node=document.getElementById('widget-'+key)||document.getElementById(key),frame=document.querySelector('iframe');if(node)node.textContent=value;else if(key==='title'){document.title=value;if(frame)frame.title=value;}else if(key==='description'&&frame)frame.setAttribute('aria-label',value);});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();})(CONFIG);`.replace('CONFIG', bootConfig);
    const injection = `<script>${bootScript.replace(/<\/script/gi, '<\\/script')}</script>`;
    const rendered = /<head\b[^>]*>/i.test(sourceHtml)
      ? sourceHtml.replace(/<head\b[^>]*>/i, `$&${injection}`)
      : sourceHtml.replace(/<html\b[^>]*>/i, `$&<head>${injection}</head>`);
    const outputPath = path.join(this.widgetsDir, 'configs', `${String(widgetData.id).replace(/[^a-zA-Z0-9_-]/g, '')}.html`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, rendered, 'utf8');
    return pathToFileURL(outputPath).href;
  }

  async activate(id) {
    this.requireUnlocked();
    const widgetData = this.findWidget(id);
    if (!widgetData) throw new Error('Widget not found');

    try {
      const config = await this.getConfig(id);
      const url = this.configuredWidgetUrl(widgetData, config);
      const invokerPath = path.join(__dirname, 'widget-invoker.mjs');
      const optionsJson = JSON.stringify(widgetData.options);

      spawn(process.execPath, [invokerPath, 'activate', id, url, optionsJson], {
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
        stdio: 'inherit',
      });

      widgetData.active = true;
      this.persist();
      return { success: true };
    } catch (e) {
      console.error('Failed to activate widget:', e);
      throw e;
    }
  }

  async deactivate(id) {
    this.requireUnlocked();
    const widgetData = this.findWidget(id);
    if (!widgetData) throw new Error('Widget not found');

    try {
      const invokerPath = path.join(__dirname, 'widget-invoker.mjs');
      const config = await this.getConfig(id);
      const url = this.configuredWidgetUrl(widgetData, config);

      await new Promise((resolve) => {
        const child = spawn(process.execPath, [invokerPath, 'deactivate', id, url], {
          env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
          stdio: 'inherit',
        });
        child.on('exit', () => resolve());
        child.on('error', () => resolve());
      });

      widgetData.active = false;
      this.persist();
      return { success: true };
    } catch (e) {
      console.error('Failed to deactivate widget:', e);
      throw e;
    }
  }

  async toggleAll(activate) {
    this.requireUnlocked();
    const targets = this.widgets.filter((w) => w.active !== activate);
    for (const widget of targets) {
      if (activate) await this.activate(widget.id);
      else await this.deactivate(widget.id);
    }
    return { success: true, count: targets.length };
  }

  async remove(id) {
    this.requireUnlocked();
    await this.deactivate(id);
    const index = this.widgets.findIndex((w) => w.id.toString() === id.toString());
    if (index !== -1) {
      const widget = this.widgets[index];
      if (widget.type === 'git' && widget.path && widget.path.startsWith(this.widgetsDir)) {
        try {
          fs.rmSync(widget.path, { recursive: true, force: true });
        } catch { /* ignore */ }
      }
      this.widgets.splice(index, 1);
      this.persist();
    }
    return { success: true };
  }

  async fetch(id) {
    this.requireUnlocked();
    const widget = this.findWidget(id);
    if (!widget || widget.type !== 'git') throw new Error('Not a git widget');
    return execFileAsync('git', ['fetch'], { cwd: widget.path });
  }

  async pull(id) {
    this.requireUnlocked();
    const widget = this.findWidget(id);
    if (!widget || widget.type !== 'git') throw new Error('Not a git widget');
    const result = await execFileAsync('git', ['pull'], { cwd: widget.path });
    return { success: true, output: result.stdout };
  }

  async checkUpdate(id) {
    this.requireUnlocked();
    const widget = this.findWidget(id);
    if (!widget || widget.type !== 'git') throw new Error('Not a git widget');

    await execFileAsync('git', ['fetch'], { cwd: widget.path });
    const { stdout } = await execFileAsync('git', ['rev-list', 'HEAD...@{u}', '--count'], { cwd: widget.path });
    const count = parseInt(stdout.trim(), 10);
    return { hasUpdate: count > 0, count };
  }

  async stopAllProcesses() {
    try {
      const stopPath = path.join(__dirname, 'stop-all.mjs');
      await new Promise((resolve) => {
        const child = spawn(process.execPath, [stopPath], {
          env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
          stdio: 'ignore',
        });
        child.on('exit', () => resolve());
        child.on('error', () => resolve());
        setTimeout(resolve, 2500);
      });
    } catch { /* ignore */ }
  }

  resetActiveFlags() {
    if (!vault.data) return;
    let dirty = false;
    for (const widget of this.widgets) {
      if (widget.active) {
        widget.active = false;
        dirty = true;
      }
    }
    if (dirty) this.persist();
  }
}

export default new WidgetManager();
