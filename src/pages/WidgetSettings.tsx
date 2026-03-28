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
  CheckCircle2
} from 'lucide-react';

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

  // Form state
  const [name, setName] = useState('');
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(300);
  const [x, setX] = useState(100);
  const [y, setY] = useState(100);
  const [opacity, setOpacity] = useState(1);

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
          opacity: Number(opacity)
        }
      };
      await (window as any).electron.widget.update(id, updates);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert('Kaydetme hatası: ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Bu widget\'ı silmek istediğinize emin misiniz?')) return;
    try {
      await (window as any).electron.widget.remove(id);
      navigate('/');
    } catch (e) {
      alert('Silme hatası: ' + (e as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader className="animate-spin text-indigo-500" size={48} />
        <p className="text-gray-400">Yükleniyor...</p>
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <h2 className="text-2xl font-bold text-white">Widget bulunamadı</h2>
        <Link to="/" className="text-indigo-400 hover:underline">Ana sayfaya dön</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-xl bg-surface hover:bg-white/5 text-gray-400 transition-all border border-border/50"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Settings className="text-indigo-400" size={28} />
              Widget Ayarları
            </h1>
            <p className="text-gray-400 text-sm mt-1">{widget.name} yapılandırılıyor</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDelete}
            className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20"
            title="Widget'ı Sil"
          >
            <Trash size={20} />
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`btn-primary px-6 h-12 gap-2 shadow-xl ${saveSuccess ? 'bg-emerald-600' : ''}`}
          >
            {saving ? <Loader className="animate-spin" size={20} /> : saveSuccess ? <CheckCircle2 size={20} /> : <Save size={20} />}
            {saveSuccess ? 'Kaydedildi' : 'Kaydet'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Info */}
        <section className="bg-surface/30 border border-border/50 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Type className="text-indigo-400" size={20} />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider text-xs">Temel Bilgiler</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-widest">Kısa İsim</label>
              <input 
                type="text" 
                className="input-field h-12 bg-surface"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-widest">Kaynak URL / Yol</label>
              <div className="px-4 py-3 bg-black/20 rounded-xl border border-border/30 text-xs font-mono text-gray-500 break-all select-all">
                {widget.source}
              </div>
            </div>
          </div>
        </section>

        {/* Visibility */}
        <section className="bg-surface/30 border border-border/50 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="text-emerald-400" size={20} />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider text-xs">Görünüm</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest px-1">
                <label>Opaklık (Saydamlık)</label>
                <span>%{Math.round(opacity * 100)}</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.05"
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
              />
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-gray-400">
              <p>Saydamlık ayarı bazı widget temalarında arka planın daha şık durmasını sağlar.</p>
            </div>
          </div>
        </section>

        {/* Dimensions */}
        <section className="bg-surface/30 border border-border/50 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Maximize className="text-blue-400" size={20} />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider text-xs">Boyutlar (px)</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-widest">Genişlik</label>
              <input 
                type="number" 
                className="input-field h-12 bg-surface text-center"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-widest">Yükseklik</label>
              <input 
                type="number" 
                className="input-field h-12 bg-surface text-center"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        {/* Position */}
        <section className="bg-surface/30 border border-border/50 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Move className="text-purple-400" size={20} />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider text-xs">Konum (px)</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-widest">Sol (X)</label>
              <input 
                type="number" 
                className="input-field h-12 bg-surface text-center"
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-widest">Üst (Y)</label>
              <input 
                type="number" 
                className="input-field h-12 bg-surface text-center"
                value={y}
                onChange={(e) => setY(Number(e.target.value))}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="p-6 rounded-3xl bg-yellow-500/5 border border-yellow-500/10 flex gap-4">
        <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500 h-fit">
          <Settings size={24} />
        </div>
        <div>
          <h4 className="font-bold text-white mb-1">Değişikliklerin Uygulanması</h4>
          <p className="text-sm text-gray-400">
            Boyut ve konum ayarlarının etkili olması için widget'ı kapatıp tekrar açmanız gerekebilir. Bazı değişiklikler anında yansıtılır.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WidgetSettings;