import { DesktopWidget } from '@osmn-byhn/widget-core';
import process from 'process';

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
      widget.launchStandalone();
      console.log('Widget launched standalone and persistence enabled.');
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
      
      // Targeted fallback: kill only processes for this specific URL
      try {
        const { execSync } = await import('child_process');
        if (process.platform !== 'win32') {
          try {
            // Escape the URL for shell use
            const escapedUrl = url.replace(/'/g, "'\\''");
            execSync(`pkill -f "'${escapedUrl}'"`, { stdio: 'ignore' });
            console.log('Targeted pkill for this URL successful.');
          } catch (e) {
            console.log('No processes found matching URL.');
          }
          // NOTE: Do NOT use `pkill -f runner.js` — it would kill ALL widgets
        }
      } catch (e) {
        console.error('Error during pkill:', e);
      }
      
      process.exit(0);
    }
  } catch (e) {
    console.error(`Error in invoker (${action}):`, e);
    process.exit(1);
  }
}

run();
