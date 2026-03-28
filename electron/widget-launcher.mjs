import { DesktopWidget } from '@osmn-byhn/widget-core';
import process from 'process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logPath = path.join(__dirname, 'widget-launcher.log');

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  fs.appendFileSync(logPath, line);
  console.log(msg);
}

// Usage: node widget-launcher.mjs <url> <options_json>
const url = process.argv[2];
const optionsStr = process.argv[3];

log(`Launcher started with URL: ${url}`);

if (!url) {
  log('ERROR: URL is required');
  process.exit(1);
}

let options = {};
try {
  if (optionsStr) {
    options = JSON.parse(optionsStr);
  }
} catch (e) {
  log(`ERROR: Failed to parse options: ${e.message}`);
}

try {
  log(`Creating widget: ${url} with options: ${JSON.stringify(options)}`);
  const widget = new DesktopWidget(url, {
    ...options,
    interactive: options.interactive !== undefined ? options.interactive : true
  });

  log('Widget instance created successfully. Enabling persistence...');
  
  // Make it survive reboots
  await widget.makePersistent(options).catch(err => {
    log(`WARNING: Failed to enable persistence: ${err.message}`);
  });

  log('Persistence enabled successfully');

  // Handle process signals for cleanup
  process.on('SIGINT', () => {
    log('Received SIGINT, shutting down...');
    if (widget.deactivate) widget.deactivate();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down...');
    if (widget.deactivate) widget.deactivate();
    process.exit(0);
  });

  // Keep the process alive
  setInterval(() => {
    // Optional: could check some status here
  }, 1000);

  log('Keep-alive loop started');

} catch (e) {
  log(`CRITICAL ERROR during launch: ${e.message}\n${e.stack}`);
  process.exit(1);
}
