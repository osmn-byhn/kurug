import { DesktopWidget } from '@osmn-byhn/widget-core';
import process from 'process';
import path from 'path';

const action = process.argv[2];
const id = process.argv[3];
const url = process.argv[4];
const optionsStr = process.argv[5];

async function run() {
  try {
    let options = {};
    if (optionsStr) options = JSON.parse(optionsStr);

    if (action === 'activate') {
      console.log(`Activating widget ${id}...`);
      
      // Cleanup existing instances of this URL first to avoid duplicates
      const existingWidgets = DesktopWidget.listWidgets();
      const existing = existingWidgets.find(w => w.url === url);
      if (existing) {
        console.log(`Found existing widget for this URL: ${existing.id}. Deactivating first...`);
        DesktopWidget.deactivateById(existing.id);
        DesktopWidget.removeById(existing.id);
      }

      const widget = new DesktopWidget(url, options);
      console.log(`New widget instance created with library ID: ${widget.id}`);
      
      await widget.makePersistent(options);

      // Robust spawn for packaged environments (Windows/Linux/OSX)
      // widget.launchStandalone() in the library attempts to spawn "node" directly,
      // which fails if node isn't in PATH. We use process.execPath instead.
      const { spawn } = await import('child_process');
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      
      // Find the runner.js path in the library
      // In production, this will be in node_modules/@osmn-byhn/widget-core/dist/runner.js
      const runnerPath = path.join(__dirname, '..', 'node_modules', '@osmn-byhn/widget-core', 'dist', 'runner.js');
      
      console.log(`Bypassing library launchStandalone, manually spawning runner: ${runnerPath}`);
      
      const child = spawn(process.execPath, [runnerPath, widget.id], {
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
        detached: true,
        stdio: 'ignore'
      });
      
      child.unref();
      
      console.log('Widget runner spawned manually with Electron Node environment.');
      process.exit(0);
    } 
    else if (action === 'deactivate') {
      console.log(`Deactivating widget with ID: ${id}, URL: ${url}...`);
      const widgets = DesktopWidget.listWidgets();
      // Match by URL (primary) or ID — the library uses its own internal IDs,
      // so URL is the most reliable common key. The cascade-kill bug was caused
      // by pkill -f runner.js (already removed), not by URL matching.
      const targets = widgets.filter(w => w.url === url || w.id === id);
      
      if (targets.length > 0) {
        console.log(`Found ${targets.length} matching widget(s) in library.`);
        for (const target of targets) {
          console.log(`Deactivating ${target.id}...`);
          DesktopWidget.deactivateById(target.id);
          DesktopWidget.removeById(target.id);
        }
      }
      
      process.exit(0);
    }
  } catch (e) {
    console.error(`Error in invoker (${action}):`, e);
    process.exit(1);
  }
}

run();
