import { DesktopWidget } from '@osmn-byhn/widget-core';

console.log('Stopping all widgets...');
try {
  const success = DesktopWidget.stopAll();
  if (success) {
    console.log('All widgets stopped successfully.');
  } else {
    console.warn('Some widgets may not have stopped correctly.');
  }
  process.exit(0);
} catch (e) {
  console.error('Failed to stop all widgets:', e);
  process.exit(1);
}
