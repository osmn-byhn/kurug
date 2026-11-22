const { spawn } = require('child_process');
const path = require('path');

async function start() {
  const { createServer } = await import('vite');
  const server = await createServer({
    configFile: path.join(__dirname, '../vite.config.ts'),
    server: { host: '127.0.0.1', port: 0, strictPort: false },
  });

  await server.listen();
  const address = server.httpServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not determine the Vite development server address.');
  }

  const devServerUrl = `http://127.0.0.1:${address.port}`;
  console.log(`Kurug development server: ${devServerUrl}`);

  const electronPath = require('electron');
  const electron = spawn(electronPath, ['.'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, VITE_DEV_SERVER_URL: devServerUrl },
    stdio: 'inherit',
  });

  let stopping = false;
  const stop = async (code = 0) => {
    if (stopping) return;
    stopping = true;
    if (electron.exitCode === null) electron.kill();
    await server.close();
    process.exitCode = code;
  };

  process.on('SIGINT', () => stop(0));
  process.on('SIGTERM', () => stop(0));
  electron.on('error', (error) => {
    console.error('Could not start Electron:', error);
    stop(1);
  });
  electron.on('exit', (code, signal) => {
    stop(signal ? 1 : (code || 0));
  });
}

start().catch((error) => {
  console.error('Could not start Kurug in development mode:', error);
  process.exitCode = 1;
});
