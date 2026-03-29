import { Link, useLocation } from 'react-router-dom';
import { Cog, House } from 'lucide-react';

const Titlebar: React.FC = () => {
    const location = useLocation();

    const handleMinimize = () => (window as any).electron.windowControls.minimize();
    const handleMaximize = () => (window as any).electron.windowControls.maximize();
    const handleClose    = () => (window as any).electron.windowControls.close();

    return (
        <div
            className="flex items-center justify-between h-12 select-none border-b"
            style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                WebkitAppRegion: 'drag',
            } as any}
        >
            <div className="flex items-center px-4">
                <img src="/logo.png" alt="Kurgu" className="w-8 h-8" />
            </div>

            <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
                {location.pathname === '/' ? (
                    <Link
                        to="/settings"
                        className="flex items-center justify-center w-12 h-full transition-colors group"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        <Cog size={18} />
                    </Link>
                ) : (
                    <Link
                        to="/"
                        className="flex items-center justify-center w-12 h-full transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        <House size={18} />
                    </Link>
                )}

                <button
                    onClick={handleMinimize}
                    className="flex items-center justify-center w-12 h-full transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    title="Minimize"
                >
                    <svg width="18" height="18" viewBox="0 0 12 12">
                        <rect x="3" y="5.5" width="6" height="1" fill="currentColor" />
                    </svg>
                </button>

                <button
                    onClick={handleMaximize}
                    className="flex items-center justify-center w-12 h-full transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    title="Maximize"
                >
                    <svg width="18" height="18" viewBox="0 0 12 12">
                        <rect x="3.5" y="3.5" width="5" height="5" fill="none" stroke="currentColor" />
                    </svg>
                </button>

                <button
                    onClick={handleClose}
                    className="flex items-center justify-center w-12 h-full transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.85)';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                    title="Close"
                >
                    <svg width="18" height="18" viewBox="0 0 12 12">
                        <path d="M3.5 3.5L8.5 8.5M8.5 3.5L3.5 8.5" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Titlebar;
