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
  Link as LinkIcon
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

  // New widget form
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
    // Optimistic update
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
      // No need to loadWidgets() here because we already updated state optimistically
      // and we want to avoid any race condition with the backend file sync.
    } catch (e) {
      // Revert on error
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
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Masaüstü Araçlarım</h1>
          <p className="text-gray-400 mt-1">Widget'larınızı buradan yönetin ve pini sabitleyin.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary px-6 h-12 text-lg shadow-xl"
        >
          <Plus size={24} />
          Yeni Widget Ekle
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input 
          type="text" 
          placeholder="Ara: GitHub URL, Yerel Yol veya İsim..."
          className="input-field pl-12 h-14 bg-surface text-lg border-2 border-border focus:border-indigo-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Loader className="animate-spin text-indigo-500" size={48} />
          <p className="text-gray-400">Widget'lar yükleniyor...</p>
        </div>
      ) : filteredWidgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-surface/50 border-2 border-dashed border-border rounded-3xl space-y-6">
          <div className="p-6 bg-indigo-500/10 rounded-full">
            <Plus className="text-indigo-500" size={48} />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white">Henüz hiç widget eklenmemiş</h3>
            <p className="text-gray-400 mt-2">Sağ üstteki butona tıklayarak ilk widget'ınızı ekleyebilirsiniz.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWidgets.map((widget: Widget) => (
            <div 
              key={widget.id} 
              className={`group flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 bg-surface/40 hover:bg-surface/60 ${
                widget.active ? 'border-emerald-500/30 shadow-lg shadow-emerald-900/5' : 'border-border/50 hover:border-indigo-500/30'
              }`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`p-3 rounded-xl flex-shrink-0 ${
                  widget.type === 'git' ? 'bg-purple-500/10 text-purple-400' :
                  widget.type === 'url' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-orange-500/10 text-orange-400'
                }`}>
                  {widget.type === 'git' ? <Code size={20} /> :
                   widget.type === 'url' ? <LinkIcon size={20} /> :
                   <Folder size={20} />}
                </div>
                
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-white truncate flex items-center gap-2">
                    {widget.name}
                    {widget.active && (
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-400 truncate opacity-60">
                    {widget.source}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 pr-2">
                <Link 
                  to={`/widget-settings/${widget.id}`}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  title="Ayarlar"
                >
                  <Settings size={20} />
                </Link>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    widget.active ? 'text-emerald-400' : 'text-gray-500'
                  }`}>
                    {widget.active ? 'Aktif' : 'Pasif'}
                  </span>
                  <Switch 
                    checked={widget.active} 
                    onChange={() => toggleWidget(widget.id, widget.active)}
                    disabled={actionLoading === widget.id}
                  />
                </div>

                <button 
                  onClick={() => removeWidget(widget.id)}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  title="Kaldır"
                >
                  <Trash size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Widget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isCloning && setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-xl bg-surface border-2 border-border rounded-3xl shadow-2xl overflow-hidden glass p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-6">Yeni Widget Ekle</h2>
            
            <form onSubmit={handleAddWidget} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 ml-1">Widget İsmi (Opsiyonel)</label>
                <input 
                  type="text" 
                  className="input-field h-12 bg-bg"
                  placeholder="Örn: My Clock, Crypto Tracker"
                  value={newWidgetName}
                  onChange={(e) => setNewWidgetName(e.target.value)}
                  disabled={isCloning}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 ml-1">Kaynak (Git URL, Web URL veya Yerel Yol)</label>
                <input 
                  type="text" 
                  className="input-field h-12 bg-bg font-mono text-sm"
                  placeholder="https://github.com/user/repo veya https://google.com"
                  value={newWidgetSource}
                  onChange={(e) => setNewWidgetSource(e.target.value)}
                  required
                  disabled={isCloning}
                />
              </div>

              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex gap-3 text-sm text-gray-400">
                <div className="p-2 h-fit bg-indigo-500/10 rounded-lg text-indigo-400 flex-shrink-0">
                  <Plus size={16} />
                </div>
                <p>
                  Git URL'leri otomatik olarak klonlanır. Düz URL'ler direkt köprülenir. Yerel klasörler proje olarak baz alınır.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary flex-1 h-12"
                  disabled={isCloning}
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1 h-12 text-lg"
                  disabled={isCloning}
                >
                  {isCloning ? (
                    <><Loader className="animate-spin" /> Hazırlanıyor...</>
                  ) : (
                    'Oluştur'
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