const { DesktopWidget } = require('@osmn-byhn/widget-core');
const fs = require('fs');

try {
    const widget = new DesktopWidget('about:blank', {
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      interactive: true
    });

    const proto = Object.getPrototypeOf(widget);
    const methods = Object.getOwnPropertyNames(proto).filter(name => typeof widget[name] === 'function');
    const properties = Object.getOwnPropertyNames(widget);

    console.log('--- WIDGET CORE API ---');
    console.log('Methods:', methods);
    console.log('Properties:', properties);
    
    // Clean up if it actually created a window
    if (widget.deactivate) widget.deactivate();
    process.exit(0);
} catch (e) {
    console.error('Error inspecting widget-core:', e.message);
    process.exit(1);
}
