import AppRoutes from './routes';
import Titlebar from './components/layouts/Titlebar';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function AppShell() {
  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{
        background: 'var(--bg)',
        color: 'var(--text-primary)',
      }}
    >
      <Titlebar />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-8" style={{ background: 'var(--bg)' }}>
          <AppRoutes />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

export default App;
