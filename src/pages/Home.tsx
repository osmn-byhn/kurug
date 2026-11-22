import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
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
  ChevronRight,
} from 'lucide-react';
import Switch from '../components/ui/Switch';
import type { Widget } from '../types/electron';

type AddTab = 'link' | 'local';

const Home: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const [addTab, setAddTab] = useState<AddTab>('link');
  const [newWidgetName, setNewWidgetName] = useState('');
  const [newWidgetSource, setNewWidgetSource] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setWidgets(await window.electron.widget.list());
  }, []);

  useEffect(() => {
    loadAll().catch((e) => console.error('Failed to load:', e)).finally(() => setLoading(false));
  }, [loadAll]);

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
    const picked = await window.electron.dialog.openWidgetSource();
    if (picked) setLocalPath(picked);
  };

  const handleAddWidget = async (e: React.FormEvent) => {
    e.preventDefault();
    const source = addTab === 'link' ? newWidgetSource.trim() : localPath.trim();
    if (!source) return;

    setIsAdding(true);
    setAddError(null);
    try {
      await window.electron.widget.create(source, {
        name: newWidgetName.trim() || undefined,
      });
      setIsModalOpen(false);
      await loadAll();
    } catch (err) {
      setAddError((err as Error).message);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleWidget = async (id: string, currentlyActive: boolean) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, active: !currentlyActive } : w)));
    setActionLoading(id);
    try {
      if (currentlyActive) await window.electron.widget.deactivate(id);
      else await window.electron.widget.activate(id);
    } catch (err) {
      setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, active: currentlyActive } : w)));
      alert('Error toggling widget: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const removeWidget = async (id: string) => {
    if (!confirm('Remove this widget?')) return;
    setActionLoading(id);
    try {
      await window.electron.widget.remove(id);
      await loadAll();
    } catch (err) {
      alert('Error removing widget: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredWidgets = useMemo(() => {
    const q = filter.toLowerCase();
    return widgets.filter((w) => w.name.toLowerCase().includes(q) || w.source.toLowerCase().includes(q));
  }, [widgets, filter]);

  const allActive = widgets.length > 0 && widgets.every((w) => w.active);

  const toggleAll = async () => {
    const shouldActivate = !allActive;
    setWidgets((prev) => prev.map((w) => ({ ...w, active: shouldActivate })));
    try {
      await window.electron.widget.toggleAll(shouldActivate);
    } catch (err) {
      await loadAll();
      alert('Error: ' + (err as Error).message);
    }
  };

  const canSubmit = addTab === 'link' ? newWidgetSource.trim().length > 0 : localPath.trim().length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-end justify-between pt-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Widgets</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage and run your desktop widgets</p>
        </div>
        <button onClick={openModal} className="btn-primary px-5 h-10 text-sm">
          <Plus size={16} />
          Add Widget
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
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
            className="flex items-center gap-2 px-4 h-11 rounded-xl border text-xs font-medium transition-all flex-shrink-0"
            style={{
              background: allActive ? 'color-mix(in srgb, var(--success) 12%, transparent)' : 'var(--surface)',
              borderColor: allActive ? 'color-mix(in srgb, var(--success) 30%, transparent)' : 'var(--border)',
              color: allActive ? 'var(--success)' : 'var(--text-secondary)',
            }}
            title={allActive ? 'Deactivate all widgets' : 'Activate all widgets'}
          >
            <Power size={14} />
            {allActive ? 'All Off' : 'All On'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-56 space-y-3">
          <Loader className="animate-spin" size={28} style={{ color: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading widgets...</p>
        </div>
      ) : filteredWidgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-72 border border-dashed rounded-2xl space-y-4" style={{ borderColor: 'var(--border)' }}>
          <div className="p-4 rounded-2xl" style={{ background: 'var(--surface)' }}>
            <Layers size={32} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="text-center">
            <h3 className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>No widgets yet</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Add your first widget to get started.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredWidgets.map((widget) => (
            <WidgetRow
              key={widget.id}
              widget={widget}
              busy={actionLoading === widget.id}
              onToggle={toggleWidget}
              onRemove={removeWidget}
            />
          ))}
        </div>
      )}

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ paddingTop: '48px' }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl animate-fade-in overflow-hidden border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Add Widget</h2>
              <button onClick={closeModal} disabled={isAdding} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <div className="flex mx-6 mb-5 rounded-xl p-1 gap-1" style={{ background: 'var(--bg)' }}>
              <button
                type="button"
                onClick={() => { setAddTab('link'); setAddError(null); }}
                className="flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: addTab === 'link' ? 'var(--accent)' : 'transparent',
                  color: addTab === 'link' ? 'var(--accent-fg)' : 'var(--text-muted)',
                }}
              >
                <Globe size={13} />
                Link / Git URL
              </button>
              <button
                type="button"
                onClick={() => { setAddTab('local'); setAddError(null); }}
                className="flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: addTab === 'local' ? 'var(--accent)' : 'transparent',
                  color: addTab === 'local' ? 'var(--accent-fg)' : 'var(--text-muted)',
                }}
              >
                <FolderOpen size={13} />
                Local Folder
              </button>
            </div>

            <form onSubmit={handleAddWidget} className="px-6 pb-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Display Name <span className="normal-case font-normal">(optional)</span>
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

              {addTab === 'link' ? (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
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
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    HTML File or Project Folder
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center px-3 h-10 rounded-xl border text-xs font-mono overflow-hidden" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      <span className="truncate">{localPath || <span style={{ color: 'var(--text-muted)' }}>No file or folder selected</span>}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleBrowseFolder}
                      disabled={isAdding}
                      className="btn-secondary h-10 px-3 text-xs"
                    >
                      <FolderOpen size={14} />
                      Browse
                    </button>
                  </div>
                </div>
              )}

              {addError && (
                <div className="px-3 py-2.5 rounded-xl text-xs leading-relaxed" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}>
                  {addError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1 h-10 text-sm" disabled={isAdding}>Cancel</button>
                <button type="submit" className="btn-primary flex-1 h-10 text-sm" disabled={isAdding || !canSubmit}>
                  {isAdding ? <><Loader className="animate-spin" size={14} /> Setting up...</> : <><ChevronRight size={14} /> Add</>}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

    </div>
  );
};

const WidgetRow = memo(function WidgetRow({
  widget,
  busy,
  onToggle,
  onRemove,
}: {
  widget: Widget;
  busy: boolean;
  onToggle: (id: string, active: boolean) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className="group flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200"
      style={{
        background: widget.active ? 'var(--surface)' : 'color-mix(in srgb, var(--surface) 70%, transparent)',
        borderColor: widget.active ? 'color-mix(in srgb, var(--success) 25%, transparent)' : 'var(--border)',
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: widget.type === 'git'
              ? 'rgba(168,85,247,0.12)'
              : widget.type === 'url'
                ? 'rgba(59,130,246,0.12)'
                : 'rgba(249,115,22,0.12)',
            color: widget.type === 'git' ? '#c084fc' : widget.type === 'url' ? '#60a5fa' : '#fb923c',
          }}
        >
          {widget.type === 'git' ? <Code size={14} /> : widget.type === 'url' ? <LinkIcon size={14} /> : <Folder size={14} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{widget.name}</h3>
            {widget.active && <span className="flex h-1.5 w-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: 'var(--success)' }} />}
          </div>
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {widget.source}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 pl-3">
        <Link
          to={`/widget-settings/${widget.id}`}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: 'var(--text-muted)' }}
          title="Settings"
        >
          <Settings size={15} />
        </Link>
        <button
          onClick={() => onRemove(widget.id)}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          style={{ color: 'var(--text-muted)' }}
          title="Remove"
        >
          <Trash size={15} />
        </button>
        <div className="flex items-center gap-2 ml-2 pl-2" style={{ borderLeft: '1px solid var(--border)' }}>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider w-10 text-right"
            style={{ color: widget.active ? 'var(--success)' : 'var(--text-muted)' }}
          >
            {widget.active ? 'On' : 'Off'}
          </span>
          <Switch
            checked={widget.active}
            onChange={() => onToggle(widget.id, widget.active)}
            disabled={busy}
          />
        </div>
      </div>
    </div>
  );
});

export default Home;
