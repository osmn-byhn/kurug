import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Layers,
  FolderOpen,
  Globe,
  X,
  Power,
  ChevronRight
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

type AddTab = 'link' | 'local';

const Home: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  // Modal state
  const [addTab, setAddTab] = useState<AddTab>('link');
  const [newWidgetName, setNewWidgetName] = useState('');
  const [newWidgetSource, setNewWidgetSource] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

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

  const resetModal = () => {
    setNewWidgetName('');
    setNewWidgetSource('');
    setLocalPath('');
    setAddTab('link');
    setAddError(null);
  };

  const openModal = () => { resetModal(); setIsModalOpen(true); };
  const closeModal = () => { if (!isAdding) setIsModalOpen(false); };

  const handleBrowseFolder = async () => {
    const picked = await (window as any).electron.dialog.openFolder();
    if (picked) setLocalPath(picked);
  };

  const handleAddWidget = async (e: React.FormEvent) => {
    e.preventDefault();
    const source = addTab === 'link' ? newWidgetSource.trim() : localPath.trim();
    if (!source) return;

    setIsAdding(true);
    setAddError(null);
    try {
      await (window as any).electron.widget.create(source, { name: newWidgetName.trim() || undefined });
      setIsModalOpen(false);
      await loadWidgets();
    } catch (e) {
      setAddError((e as Error).message);
    } finally {
      setIsAdding(false);
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

  const allActive = widgets.length > 0 && widgets.every(w => w.active);

  const toggleAll = async () => {
    const shouldActivate = !allActive;
    // Optimistic update
    setWidgets(prev => prev.map(w => ({ ...w, active: shouldActivate })));
    try {
      for (const w of widgets) {
        if (shouldActivate) {
          await (window as any).electron.widget.activate(w.id);
        } else {
          await (window as any).electron.widget.deactivate(w.id);
        }
      }
    } catch (e) {
      // Revert on error
      await loadWidgets();
      alert('Error: ' + (e as Error).message);
    }
  };

  const canSubmit = addTab === 'link'
    ? newWidgetSource.trim().length > 0
    : localPath.trim().length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-end justify-between pt-2">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Widgets</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your desktop widgets</p>
        </div>
        <button onClick={openModal} className="btn-primary px-5 h-10 text-sm">
          <Plus size={16} />
          Add Widget
        </button>
      </div>

      {/* Search + Toggle All */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
          <input
            type="text"
            placeholder="Search by name or source..."
            className="input-field pl-10 h-11 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        {widgets.length > 0 && (
          <button
            onClick={toggleAll}
            className={`flex items-center gap-2 px-4 h-11 rounded-xl border text-xs font-medium transition-all flex-shrink-0 ${
              allActive
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-white/5 border-border/50 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
            title={allActive ? 'Deactivate all widgets' : 'Activate all widgets'}
          >
            <Power size={14} />
            {allActive ? 'All Off' : 'All On'}
          </button>
        )}
      </div>

      {/* Widget List */}
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
              className={`group flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${widget.active
                ? 'bg-surface border-emerald-500/20 shadow-sm shadow-emerald-900/10'
                : 'bg-surface/50 border-border/40 hover:border-border hover:bg-surface/80'
                }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${widget.type === 'git' ? 'bg-purple-500/10 text-purple-400' :
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
                  <span className={`text-[10px] font-semibold uppercase tracking-wider w-10 text-right ${widget.active ? 'text-emerald-500' : 'text-gray-600'
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

      {/* ── Add Widget Modal ── */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ paddingTop: '48px' }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-surface border border-border/60 rounded-2xl shadow-2xl animate-fade-in overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h2 className="text-base font-semibold text-white">Add Widget</h2>
              <button
                onClick={closeModal}
                disabled={isAdding}
                className="p-1 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex mx-6 mb-5 bg-black/30 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => { setAddTab('link'); setAddError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-xs font-medium transition-all ${addTab === 'link'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <Globe size={13} />
                Link / Git URL
              </button>
              <button
                type="button"
                onClick={() => { setAddTab('local'); setAddError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-xs font-medium transition-all ${addTab === 'local'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <FolderOpen size={13} />
                Local Folder
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddWidget} className="px-6 pb-6 space-y-4">

              {/* Display name (shared) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  Display Name{' '}
                  <span className="normal-case font-normal text-gray-700">(optional)</span>
                </label>
                <input
                  type="text"
                  className="input-field h-10 text-sm"
                  placeholder="e.g. My Clock, Crypto Ticker..."
                  value={newWidgetName}
                  onChange={(e) => setNewWidgetName(e.target.value)}
                  disabled={isAdding}
                />
              </div>

              {/* Tab-specific source */}
              {addTab === 'link' ? (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                    URL or Git Repository
                  </label>
                  <input
                    type="text"
                    className="input-field h-10 text-sm font-mono"
                    placeholder="https://github.com/user/repo"
                    value={newWidgetSource}
                    onChange={(e) => setNewWidgetSource(e.target.value)}
                    required
                    disabled={isAdding}
                    autoFocus
                  />
                  <p className="text-[11px] text-gray-700 leading-relaxed">
                    Git repos are cloned automatically. Plain URLs launch directly as a web widget.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                    Project Folder
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center px-3 h-10 rounded-xl bg-bg border border-border/50 text-xs font-mono text-gray-400 overflow-hidden">
                      <span className="truncate">
                        {localPath || <span className="text-gray-700">No folder selected</span>}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleBrowseFolder}
                      disabled={isAdding}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-border/50 text-xs text-gray-300 font-medium transition-all disabled:opacity-50"
                    >
                      <FolderOpen size={14} />
                      Browse
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-700 leading-relaxed">
                    Select a local project folder. It will be used as-is without cloning.
                  </p>
                </div>
              )}

              {/* Error banner */}
              {addError && (
                <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 leading-relaxed">
                  {addError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1 h-10 text-sm"
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 h-10 text-sm"
                  disabled={isAdding || !canSubmit}
                >
                  {isAdding
                    ? <><Loader className="animate-spin" size={14} /> Setting up...</>
                    : <><ChevronRight size={14} /> Add</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </div>
  );
};

export default Home;