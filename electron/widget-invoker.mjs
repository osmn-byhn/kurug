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
      const targets = widgets.filter(w => w.url === url || w.id === id);
      
      if (targets.length > 0) {
        console.log(`Found ${targets.length} matching widget(s) in library.`);
        for (const target of targets) {
          console.log(`Deactivating ${target.id}...`);
          DesktopWidget.deactivateById(target.id);
          DesktopWidget.removeById(target.id);
        }
      }
      
      // Aggressive fallback: kill any node process that has this URL in its command line
      try {
        const { execSync } = await import('child_process');
        if (process.platform !== 'win32') {
          // Find processes with the URL and kill them
          console.log(`Attempting aggressive pkill for URL: ${url}`);
          // We use pkill -f to match the full command line
          try {
            execSync(`pkill -f "${url}"`);
            console.log('Aggressive pkill (URL match) successful.');
          } catch (e) {
            console.log('No processes found matching URL.');
          }
          
          // Also try pkill -f runner.js just in case
          try {
            execSync('pkill -f runner.js');
          } catch (e) {}
        }
      } catch (e) {
        console.error('Error during aggressive pkill:', e);
      }
      
      process.exit(0);
    }
  } catch (e) {
    console.error(`Error in invoker (${action}):`, e);
    process.exit(1);
  }
}

run();
