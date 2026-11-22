import AppRoutes from './routes';
import Titlebar from './components/layouts/Titlebar';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LockScreen from './pages/LockScreen';

function AppShell() {
  const { state } = useAuth();
  const locked = state !== 'unlocked';

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}
    >
      <Titlebar locked={locked} />
      {locked ? (
        <LockScreen />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto p-8" style={{ background: 'var(--bg)' }}>
            <AppRoutes />
          </main>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
