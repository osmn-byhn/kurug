import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Settings, 
  Trash, 
  Code, 
  Folder,
  Loader,
  Link as LinkIcon,
  Layers
} from 'lucide-react';
import Switch from '../components/ui/Switch';

interface Widget {
  id: string;
  name: string;
  type: 'git' | 'url' | 'local';
  source: string;
  path: string;
  active: boolean;
  options: any;
}

const Home: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const [newWidgetSource, setNewWidgetSource] = useState('');
  const [newWidgetName, setNewWidgetName] = useState('');
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = async () => {
    try {
      const data = await (window as any).electron.widget.list();
      setWidgets(data);
    } catch (e) {
      console.error('Failed to load widgets:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWidget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWidgetSource) return;

    setIsCloning(true);
    try {
      await (window as any).electron.widget.create(newWidgetSource, { name: newWidgetName });
      setNewWidgetSource('');
      setNewWidgetName('');
      setIsModalOpen(false);
      await loadWidgets();
    } catch (e) {
      alert('Failed to add widget: ' + (e as Error).message);
    } finally {
      setIsCloning(false);
    }
  };

  const toggleWidget = async (id: string, currentlyActive: boolean) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, active: !currentlyActive } : w
    ));
    
    setActionLoading(id);
    try {
      if (currentlyActive) {
        await (window as any).electron.widget.deactivate(id);
      } else {
        await (window as any).electron.widget.activate(id);
      }
    } catch (e) {
      setWidgets(prev => prev.map(w => 
        w.id === id ? { ...w, active: currentlyActive } : w
      ));
      alert('Error toggling widget: ' + (e as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const removeWidget = async (id: string) => {
    if (!confirm('Are you sure you want to remove this widget?')) return;
    setActionLoading(id);
    try {
      await (window as any).electron.widget.remove(id);
      await loadWidgets();
    } catch (e) {
      alert('Error removing widget: ' + (e as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredWidgets = widgets.filter((w: Widget) => 
    w.name.toLowerCase().includes(filter.toLowerCase()) || 
    w.source.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between pt-2">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Widgets</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your desktop widgets</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary px-5 h-10 text-sm"
        >
          <Plus size={16} />
          Add Widget
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
        <input 
          type="text" 
          placeholder="Search by name or source..."
          className="input-field pl-10 h-11 text-sm bg-surface border border-border/60 focus:border-indigo-500/60 placeholder-gray-600"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-56 space-y-3">
          <Loader className="animate-spin text-indigo-500" size={28} />
          <p className="text-sm text-gray-500">Loading widgets...</p>
        </div>
      ) : filteredWidgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-72 border border-dashed border-border/50 rounded-2xl space-y-4">
          <div className="p-4 bg-surface rounded-2xl">
            <Layers className="text-gray-600" size={32} />
          </div>
          <div className="text-center">
            <h3 className="text-base font-medium text-gray-300">No widgets yet</h3>
            <p className="text-sm text-gray-600 mt-1">Add your first widget to get started.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredWidgets.map((widget: Widget) => (
            <div 
              key={widget.id} 
              className={`group flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                widget.active 
                  ? 'bg-surface border-emerald-500/20 shadow-sm shadow-emerald-900/10' 
                  : 'bg-surface/50 border-border/40 hover:border-border hover:bg-surface/80'
              }`}
            >
              {/* Icon + Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  widget.type === 'git' ? 'bg-purple-500/10 text-purple-400' :
                  widget.type === 'url' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-orange-500/10 text-orange-400'
                }`}>
                  {widget.type === 'git' ? <Code size={14} /> :
                   widget.type === 'url' ? <LinkIcon size={14} /> :
                   <Folder size={14} />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white truncate">{widget.name}</h3>
                    {widget.active && (
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate mt-0.5">{widget.source}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 pl-3">
                <Link 
                  to={`/widget-settings/${widget.id}`}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all"
                  title="Settings"
                >
                  <Settings size={15} />
                </Link>

                <button 
                  onClick={() => removeWidget(widget.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  title="Remove"
                >
                  <Trash size={15} />
                </button>

                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border/40">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider w-10 text-right ${
                    widget.active ? 'text-emerald-500' : 'text-gray-600'
                  }`}>
                    {widget.active ? 'On' : 'Off'}
                  </span>
                  <Switch 
                    checked={widget.active} 
                    onChange={() => toggleWidget(widget.id, widget.active)}
                    disabled={actionLoading === widget.id}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Widget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !isCloning && setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-surface border border-border/60 rounded-2xl shadow-2xl p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-white mb-5">Add Widget</h2>
            
            <form onSubmit={handleAddWidget} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name <span className="normal-case text-gray-600">(optional)</span></label>
                <input 
                  type="text" 
                  className="input-field h-10 text-sm bg-bg border border-border/60 focus:border-indigo-500/60"
                  placeholder="e.g. My Clock, Crypto Ticker..."
                  value={newWidgetName}
                  onChange={(e) => setNewWidgetName(e.target.value)}
                  disabled={isCloning}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Source</label>
                <input 
                  type="text" 
                  className="input-field h-10 text-sm bg-bg font-mono border border-border/60 focus:border-indigo-500/60"
                  placeholder="https://github.com/user/repo or /local/path"
                  value={newWidgetSource}
                  onChange={(e) => setNewWidgetSource(e.target.value)}
                  required
                  disabled={isCloning}
                />
              </div>

              <p className="text-xs text-gray-600 leading-relaxed px-1">
                Git URLs are cloned automatically. Plain URLs are linked directly. Local folders are used as-is.
              </p>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary flex-1 h-10 text-sm"
                  disabled={isCloning}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1 h-10 text-sm"
                  disabled={isCloning}
                >
                  {isCloning ? (
                    <><Loader className="animate-spin" size={14} /> Setting up...</>
                  ) : (
                    'Add'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;