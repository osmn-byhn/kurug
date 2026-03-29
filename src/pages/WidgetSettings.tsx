import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Settings, 
  Save, 
  Trash, 
  Move, 
  Maximize, 
  Eye, 
  Type,
  Loader,
  CheckCircle2,
  MousePointer2,
  Cloud,
  RefreshCw,
  GitBranch,
  Download
} from 'lucide-react';
import Switch from '../components/ui/Switch';

interface Widget {
  id: string;
  name: string;
  type: string;
  source: string;
  path: string;
  active: boolean;
  options: {
    width: number;
    height: number;
    x: number;
    y: number;
    opacity: number;
    interactive?: boolean;
    scroll?: boolean;
    blur?: number;
    [key: string]: any;
  };
}

const WidgetSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [widget, setWidget] = useState<Widget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [name, setName] = useState('');
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(300);
  const [x, setX] = useState(100);
  const [y, setY] = useState(100);
  const [opacity, setOpacity] = useState(1);
  const [interactive, setInteractive] = useState(true);
  const [scroll, setScroll] = useState(true);
  const [blur, setBlur] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [gitStatus, setGitStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  useEffect(() => {
    if (id) {
      loadWidget(id);
    }
  }, [id]);

  const loadWidget = async (widgetId: string) => {
    try {
      const data = await (window as any).electron.widget.get(widgetId);
      if (data) {
        setWidget(data);
        setName(data.name);
        setWidth(data.options.width || 400);
        setHeight(data.options.height || 300);
        setX(data.options.x || 100);
        setY(data.options.y || 100);
        setOpacity(data.options.opacity !== undefined ? data.options.opacity : 1);
        setInteractive(data.options.interactive !== undefined ? data.options.interactive : true);
        setScroll(data.options.scroll !== undefined ? data.options.scroll : true);
        setBlur(data.options.blur || 0);
      }
    } catch (e) {
      console.error('Failed to load widget:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !widget) return;
    setSaving(true);
    try {
      const updates = {
        name,
        options: {
          ...widget.options,
          width: Number(width),
          height: Number(height),
          x: Number(x),
          y: Number(y),
          opacity: Number(opacity),
          interactive,
          scroll,
          blur: Number(blur)
        }
      };
      await (window as any).electron.widget.update(id, updates);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert('Save error: ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this widget?')) return;
    try {
      await (window as any).electron.widget.remove(id);
      navigate('/');
    } catch (e) {
      alert('Delete error: ' + (e as Error).message);
    }
  };

  const handleCheckUpdate = async () => {
    if (!id) return;
    setCheckingUpdate(true);
    setGitStatus(null);
    try {
      const result = await (window as any).electron.widget.checkUpdate(id);
      setHasUpdate(result.hasUpdate);
      if (result.hasUpdate) {
        setGitStatus({ type: 'info', message: `${result.count} new commit(s) available.` });
      } else {
        setGitStatus({ type: 'success', message: 'Widget is up to date.' });
      }
    } catch (e) {
      setGitStatus({ type: 'error', message: (e as Error).message });
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handlePull = async () => {
    if (!id) return;
    setPulling(true);
    setGitStatus(null);
    try {
      await (window as any).electron.widget.pull(id);
      setGitStatus({ type: 'success', message: 'Widget updated successfully.' });
      setHasUpdate(false);
    } catch (e) {
      setGitStatus({ type: 'error', message: (e as Error).message });
    } finally {
      setPulling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        <Loader className="animate-spin text-indigo-500" size={28} />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <h2 className="text-lg font-medium text-gray-300">Widget not found</h2>
        <Link to="/" className="text-sm text-indigo-400 hover:underline">Go back home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg bg-surface hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-all border border-border/40"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">
              <Settings className="text-indigo-400" size={18} />
              Widget Settings
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">{widget.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDelete}
            className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20"
            title="Delete widget"
          >
            <Trash size={16} />
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`btn-primary px-4 h-9 text-sm gap-1.5 ${saveSuccess ? 'bg-emerald-600 hover:bg-emerald-600' : ''}`}
          >
            {saving ? <Loader className="animate-spin" size={14} /> : saveSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {saveSuccess ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* Live Preview */}
      <section className="bg-surface/40 border border-border/40 rounded-2xl p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Eye size={100} className="text-white" strokeWidth={1} />
        </div>
        
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
              </span>
              Live Preview
            </div>
            <h2 className="text-base font-semibold text-white">Visual Configuration</h2>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
              Changes are reflected here in real time, simulating how the widget will appear on your desktop.
            </p>
          </div>

          <div className="relative w-full max-w-[280px] aspect-video flex items-center justify-center p-5 bg-black/30 rounded-2xl border border-white/5">
            <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-40 pointer-events-none">
              <div className="absolute -top-16 -left-16 w-48 h-48 bg-indigo-500/20 blur-[80px] rounded-full"></div>
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full"></div>
            </div>

            <div 
              className={`
                w-40 h-20 rounded-xl shadow-2xl transition-all duration-300 flex flex-col p-3 relative overflow-hidden
                ${interactive ? 'ring-1 ring-indigo-500/40' : 'grayscale opacity-60'}
              `}
              style={{
                backgroundColor: `rgba(30, 30, 40, ${opacity * 0.9})`,
                backdropFilter: `blur(${blur}px)`,
                opacity: opacity,
                overflowY: scroll ? 'auto' : 'hidden'
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-4 h-4 rounded bg-indigo-500 flex items-center justify-center">
                  <Settings size={8} className="text-white" />
                </div>
                <div className="h-1.5 w-14 bg-white/20 rounded"></div>
              </div>
              <div className="space-y-1.5">
                <div className="h-1 w-full bg-white/10 rounded"></div>
                <div className="h-1 w-3/4 bg-white/10 rounded"></div>
                {scroll && (
                  <div className="space-y-1.5 mt-1">
                    <div className="h-1 w-1/2 bg-white/5 rounded"></div>
                    <div className="h-1 w-2/3 bg-white/5 rounded"></div>
                  </div>
                )}
              </div>
              {!interactive && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <MousePointer2 size={12} className="text-white/40" />
                </div>
              )}
            </div>
            
            <div className="absolute bottom-2 right-3 text-[9px] font-mono text-white/15 select-none">
              {width}×{height} @ {x},{y}
            </div>
          </div>
        </div>
      </section>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Basic Info */}
        <section className="bg-surface/30 border border-border/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Type className="text-indigo-400" size={15} />
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">General</h2>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Display Name</label>
              <input 
                type="text" 
                className="input-field h-10 text-sm bg-surface border border-border/50 focus:border-indigo-500/50"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Source</label>
              <div className="px-3 py-2 bg-black/20 rounded-lg border border-border/30 text-[11px] font-mono text-gray-600 break-all select-all">
                {widget.source}
              </div>
            </div>
          </div>
        </section>

        {/* Interaction */}
        <section className="bg-surface/30 border border-border/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MousePointer2 className="text-amber-400" size={15} />
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Behavior</h2>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-border/30 hover:border-indigo-500/20 transition-colors">
              <div>
                <h3 className="text-xs font-semibold text-white">Interactive</h3>
                <p className="text-[11px] text-gray-600 mt-0.5">Allow clicks and mouse events</p>
              </div>
              <Switch checked={interactive} onChange={setInteractive} />
            </div>
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-border/30 hover:border-indigo-500/20 transition-colors">
              <div>
                <h3 className="text-xs font-semibold text-white">Scrollable</h3>
                <p className="text-[11px] text-gray-600 mt-0.5">Enable overflow scrolling</p>
              </div>
              <Switch checked={scroll} onChange={setScroll} />
            </div>
          </div>
        </section>

        {/* Updates (git only) */}
        {widget.type === 'git' && (
          <section className="bg-surface/30 border border-border/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="text-blue-400" size={15} />
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Updates</h2>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button 
                  onClick={handleCheckUpdate}
                  disabled={checkingUpdate || pulling}
                  className="flex-1 btn-secondary h-9 text-xs gap-1.5"
                >
                  {checkingUpdate ? <Loader className="animate-spin text-blue-400" size={13} /> : <RefreshCw className="text-blue-400" size={13} />}
                  Check for Updates
                </button>
                <button 
                  onClick={handlePull}
                  disabled={!hasUpdate || pulling || checkingUpdate}
                  className={`flex-1 btn-primary h-9 text-xs gap-1.5 ${!hasUpdate ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {pulling ? <Loader className="animate-spin" size={13} /> : <Download size={13} />}
                  Update Now
                </button>
              </div>

              {gitStatus && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  gitStatus.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : gitStatus.type === 'info'
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {gitStatus.type === 'success' ? <CheckCircle2 size={13} /> : gitStatus.type === 'info' ? <GitBranch size={13} /> : <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0"></span>}
                  {gitStatus.message}
                </div>
              )}

              <p className="text-[11px] text-gray-600 leading-relaxed">
                Check for new commits and pull the latest version when available.
              </p>
            </div>
          </section>
        )}

        {/* Effects */}
        <section className="bg-surface/30 border border-border/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Cloud className="text-cyan-400" size={15} />
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Effects</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 uppercase tracking-widest">
              <label>Background Blur</label>
              <span className="text-gray-400">{blur}px</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="20" 
              step="1"
              className="w-full h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
              value={blur}
              onChange={(e) => setBlur(Number(e.target.value))}
            />
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Blurs the desktop behind the widget, improving readability on busy backgrounds.
            </p>
          </div>
        </section>

        {/* Visibility */}
        <section className="bg-surface/30 border border-border/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="text-emerald-400" size={15} />
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Visibility</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 uppercase tracking-widest">
              <label>Opacity</label>
              <span className="text-gray-400">{Math.round(opacity * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="1" 
              step="0.05"
              className="w-full h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
            />
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Adjust transparency so the widget blends naturally with your desktop.
            </p>
          </div>
        </section>

        {/* Dimensions */}
        <section className="bg-surface/30 border border-border/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Maximize className="text-blue-400" size={15} />
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Size <span className="normal-case text-gray-600 font-normal">(px)</span></h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Width</label>
              <input 
                type="number" 
                className="input-field h-10 text-sm bg-surface text-center border border-border/50 focus:border-indigo-500/50"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Height</label>
              <input 
                type="number" 
                className="input-field h-10 text-sm bg-surface text-center border border-border/50 focus:border-indigo-500/50"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        {/* Position */}
        <section className="bg-surface/30 border border-border/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Move className="text-purple-400" size={15} />
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Position <span className="normal-case text-gray-600 font-normal">(px)</span></h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Left (X)</label>
              <input 
                type="number" 
                className="input-field h-10 text-sm bg-surface text-center border border-border/50 focus:border-indigo-500/50"
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Top (Y)</label>
              <input 
                type="number" 
                className="input-field h-10 text-sm bg-surface text-center border border-border/50 focus:border-indigo-500/50"
                value={y}
                onChange={(e) => setY(Number(e.target.value))}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Footer note */}
      <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 flex gap-3">
        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500 h-fit flex-shrink-0">
          <Settings size={15} />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-white mb-1">Applying Changes</h4>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Size and position changes may require restarting the widget to take effect. Some changes apply instantly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WidgetSettings;