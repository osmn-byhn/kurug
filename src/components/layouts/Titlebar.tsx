import { Link, useLocation } from 'react-router-dom';
import { Cog, House } from 'lucide-react';

const Titlebar: React.FC = () => {
    const location = useLocation();
    const handleMinimize = () => {
        (window as any).electron.windowControls.minimize();
    };

    const handleMaximize = () => {
        (window as any).electron.windowControls.maximize();
    };

    const handleClose = () => {
        (window as any).electron.windowControls.close();
    };

    return (
        <div className="flex items-center justify-between h-12 bg-[#16171d] border-b border-[#2e303a] select-none" style={{ WebkitAppRegion: 'drag' } as any}>
            <div className="flex items-center px-4 space-x-2">
                <img src="/logo.png" alt="Kurug" className="w-10 h-10" />
            </div>
            <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
                {location.pathname === '/' ? (
                    <Link to="/settings" className='flex items-center justify-center w-12 h-full hover:bg-[#2e303a] transition-colors group'>
                        <Cog size={20} className="text-[#9ca3af] group-hover:text-white" />
                    </Link>
                ) : (
                    <Link to="/" className='flex items-center justify-center w-12 h-full hover:bg-[#2e303a] transition-colors group'>
                        <House size={20} className="text-[#9ca3af] group-hover:text-white" />
                    </Link>
                )}
                <button
                    onClick={handleMinimize}
                    className="flex items-center justify-center w-12 h-full hover:bg-[#2e303a] transition-colors group"
                    title="Minimize"
                >
                    <svg width="20" height="20" viewBox="0 0 12 12" className="text-[#9ca3af] group-hover:text-white">
                        <rect x="3" y="5.5" width="6" height="1" fill="currentColor" />
                    </svg>
                </button>
                <button
                    onClick={handleMaximize}
                    className="flex items-center justify-center w-12 h-full hover:bg-[#2e303a] transition-colors group"
                    title="Maximize"
                >
                    <svg width="20" height="20" viewBox="0 0 12 12" className="text-[#9ca3af] group-hover:text-white">
                        <rect x="3.5" y="3.5" width="5" height="5" fill="none" stroke="currentColor" />
                    </svg>
                </button>
                <button
                    onClick={handleClose}
                    className="flex items-center justify-center w-12 h-full hover:bg-[#ef4444] transition-colors group"
                    title="Close"
                >
                    <svg width="20" height="20" viewBox="0 0 12 12" className="text-[#9ca3af] group-hover:text-white">
                        <path d="M3.5 3.5L8.5 8.5M8.5 3.5L3.5 8.5" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Titlebar;
