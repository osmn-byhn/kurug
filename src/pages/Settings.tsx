import React, { useMemo, useState } from 'react';
import {
  Palette,
  Shield,
  Archive,
  Info,
  Sun,
  Moon,
  Sparkles,
  Download,
  Upload,
  FolderOpen,
  AlertTriangle,
  KeyRound,
  Code2,
  RotateCcw,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  PRESET_META,
  THEME_KEYS,
  THEME_LABELS,
  toHexColor,
  type ThemePresetId,
  type ThemeVars,
} from '../lib/theme-presets';

type Tab = 'appearance' | 'security' | 'backup' | 'about';

const Settings: React.FC = () => {
  const [tab, setTab] = useState<Tab>('appearance');

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pt-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Theme, vault security, and encrypted backups
        </p>
      </div>

      <div
        className="flex gap-1 p-1 rounded-xl border overflow-x-auto"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {([
          ['appearance', Palette, 'Appearance'],
          ['security', Shield, 'Security'],
          ['backup', Archive, 'Backup'],
          ['about', Info, 'About'],
        ] as const).map(([id, Icon, label]) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-2 px-3 h-9 rounded-lg text-xs font-medium transition-all flex-shrink-0"
              style={{
                background: active ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {tab === 'appearance' && <AppearanceSection />}
      {tab === 'security' && <SecuritySection />}
      {tab === 'backup' && <BackupSection />}
      {tab === 'about' && <AboutSection />}
    </div>
  );
};

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border p-6 space-y-5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2.5">
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function AppearanceSection() {
  const { preset, vars, customCss, importedName, setPreset, setVar, setCustomCss, applyImported, resetCustomization } = useTheme();
  const [cssDraft, setCssDraft] = useState(customCss);
  const [importError, setImportError] = useState<string | null>(null);

  React.useEffect(() => {
    setCssDraft(customCss);
  }, [customCss]);

  const handlePickTheme = async () => {
    setImportError(null);
    try {
      const file = await window.electron.theme.pickFile();
      if (!file) return;
      if (!file.vars || Object.keys(file.vars).length === 0) {
        setImportError('No colors could be read from that file.');
        return;
      }
      applyImported(file.name, file.vars as Partial<ThemeVars>, file.css);
      if (file.css) setCssDraft(file.css);
    } catch (e) {
      setImportError((e as Error).message);
    }
  };

  const applyCss = () => setCustomCss(cssDraft);

  return (
    <div className="space-y-5">
      <Section title="Presets" icon={<Palette size={16} />}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PRESET_META.map((opt) => {
            const active = preset === opt.id && !importedName;
            return (
              <button
                key={opt.id}
                onClick={() => setPreset(opt.id)}
                className="text-left rounded-xl border p-3 transition-all"
                style={{
                  background: active ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--bg)',
                  borderColor: active ? 'color-mix(in srgb, var(--accent) 45%, transparent)' : 'var(--border)',
                }}
              >
                <div className="h-10 rounded-lg mb-2 overflow-hidden flex" style={{ background: 'var(--bg)' }}>
                  <Swatch preset={opt.id} />
                </div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
                <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>{opt.description}</p>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Colors" icon={preset === 'light' ? <Sun size={16} /> : <Moon size={16} />}>
        {importedName && (
          <p className="text-xs" style={{ color: 'var(--accent)' }}>
            Imported theme: {importedName}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THEME_KEYS.map((key) => (
            <label key={key} className="flex items-center justify-between gap-3">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{THEME_LABELS[key]}</span>
              <span className="flex items-center gap-2">
                <input
                  type="color"
                  value={toHexColor(vars[key])}
                  onChange={(e) => setVar(key, e.target.value)}
                  className="w-8 h-8 rounded-lg border cursor-pointer bg-transparent"
                  style={{ borderColor: 'var(--border)' }}
                />
                <input
                  type="text"
                  value={vars[key]}
                  onChange={(e) => setVar(key, e.target.value)}
                  className="input-field h-8 w-36 text-[11px] font-mono px-2"
                />
              </span>
            </label>
          ))}
        </div>
        <button onClick={resetCustomization} className="btn-secondary h-9 px-3 text-xs">
          <RotateCcw size={13} />
          Reset colors & CSS
        </button>
      </Section>

      <Section title="Custom CSS" icon={<Code2 size={16} />}>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Inject extra CSS. You can also paste Telegram Desktop <span className="font-mono">.tdesktop-theme</span> colors
          via Import, or write your own <span className="font-mono">:root</span> variables.
        </p>
        <textarea
          value={cssDraft}
          onChange={(e) => setCssDraft(e.target.value)}
          className="input-field min-h-36 py-3 font-mono text-xs leading-relaxed resize-y"
          placeholder={':root {\n  --accent: #6366f1;\n}\n'}
        />
        <div className="flex gap-2">
          <button onClick={applyCss} className="btn-primary h-9 px-4 text-xs">Apply CSS</button>
          <button onClick={handlePickTheme} className="btn-secondary h-9 px-4 text-xs">
            <Sparkles size={13} />
            Import theme file
          </button>
        </div>
        {importError && <p className="text-xs" style={{ color: 'var(--danger)' }}>{importError}</p>}
      </Section>
    </div>
  );
}

function Swatch({ preset }: { preset: ThemePresetId }) {
  const colors = useMemo(() => {
    const map: Record<ThemePresetId, [string, string, string]> = {
      dark: ['#0c0c0e', '#161618', '#6366f1'],
      light: ['#f5f5f7', '#ffffff', '#4f46e5'],
      midnight: ['#070b14', '#0f172a', '#38bdf8'],
      nord: ['#2e3440', '#3b4252', '#88c0d0'],
      catppuccin: ['#1e1e2e', '#313244', '#cba6f7'],
      dracula: ['#282a36', '#343746', '#ff79c6'],
      tokyo: ['#1a1b26', '#24283b', '#7aa2f7'],
      graphite: ['#121212', '#1c1c1c', '#d4d4d4'],
    };
    return map[preset];
  }, [preset]);
  return (
    <>
      <span className="flex-1" style={{ background: colors[0] }} />
      <span className="flex-1" style={{ background: colors[1] }} />
      <span className="w-4" style={{ background: colors[2] }} />
    </>
  );
}

function SecuritySection() {
  const { status, refresh, disablePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const threshold = status?.failThreshold ?? 5;
  const action = status?.failAction ?? 'backup-wipe';
  const backupDir = status?.panicBackupDir ?? '';

  const saveSecurity = async (payload: Parameters<typeof window.electron.vault.setSecurity>[0]) => {
    await window.electron.vault.setSecurity(payload);
    await refresh();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    setPwError(null);
    if (next.length < 6) {
      setPwError('New key must be at least 6 characters.');
      return;
    }
    if (next !== confirm) {
      setPwError('New keys do not match.');
      return;
    }
    setBusy(true);
    try {
      await window.electron.vault.changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setPwMsg('Master key updated.');
      await refresh();
    } catch (err) {
      setPwError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDisablePassword = async () => {
    setPwMsg(null);
    setPwError(null);
    setBusy(true);
    try {
      await disablePassword(current);
      setCurrent('');
      setPwMsg('Master key disabled. Kurug will open without asking for it.');
    } catch (err) {
      setPwError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pickPanicDir = async () => {
    const picked = await window.electron.dialog.openFolder();
    if (picked) await saveSecurity({ panicBackupDir: picked });
  };

  return (
    <div className="space-y-5">
      <Section title="Master key" icon={<KeyRound size={16} />}>
        <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
          {status?.passwordless
            ? 'Kurug opens automatically without a master key. You can set one below.'
            : 'A master key is optional. Disabling it lets Kurug open automatically on this device.'}
        </p>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          {!status?.passwordless && <input type="password" className="input-field h-10" placeholder="Current master key" value={current} onChange={(e) => setCurrent(e.target.value)} />}
          <input type="password" className="input-field h-10" placeholder="New master key" value={next} onChange={(e) => setNext(e.target.value)} />
          <input type="password" className="input-field h-10" placeholder="Confirm new master key" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button type="submit" className="btn-primary h-9 px-4 text-xs" disabled={busy}>{status?.passwordless ? 'Set master key' : 'Update key'}</button>
          {!status?.passwordless && <button type="button" onClick={handleDisablePassword} className="btn-secondary h-9 px-4 text-xs ml-2" disabled={busy}>Disable master key</button>}
          {pwMsg && <p className="text-xs" style={{ color: 'var(--success)' }}>{pwMsg}</p>}
          {pwError && <p className="text-xs" style={{ color: 'var(--danger)' }}>{pwError}</p>}
        </form>
      </Section>

      <Section title="Failed unlock protection" icon={<AlertTriangle size={16} />}>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          After too many wrong keys, Kurug can wipe the vault. Choose 3 or 5 attempts, and whether to keep an encrypted panic backup first.
        </p>

        <div>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Attempts</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              [0, 'Off'],
              [3, '3 tries'],
              [5, '5 tries'],
            ] as const).map(([value, label]) => {
              const active = threshold === value;
              return (
                <button
                  key={value}
                  onClick={() => saveSecurity({ failThreshold: value })}
                  className="h-10 rounded-xl border text-xs font-medium"
                  style={{
                    background: active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg)',
                    borderColor: active ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>When the limit is hit</p>
          <div className="space-y-2">
            {([
              ['none', 'Do nothing — just keep rejecting'],
              ['wipe', 'Wipe all vault data'],
              ['backup-wipe', 'Encrypted panic backup, then wipe'],
            ] as const).map(([value, label]) => {
              const active = action === value;
              return (
                <button
                  key={value}
                  onClick={() => saveSecurity({ failAction: value })}
                  className="w-full text-left px-4 py-3 rounded-xl border text-xs"
                  style={{
                    background: active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg)',
                    borderColor: active ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {action === 'backup-wipe' && (
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Panic backup folder</p>
            <div className="flex gap-2">
              <div className="flex-1 input-field h-10 flex items-center text-xs font-mono truncate">
                {backupDir}
              </div>
              <button type="button" onClick={pickPanicDir} className="btn-secondary h-10 px-3 text-xs">
                <FolderOpen size={14} />
                Browse
              </button>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              The panic copy is already encrypted with your current master key. Restore it from Backup using that same key.
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}

function BackupSection() {
  const { refresh } = useAuth();
  const [importKey, setImportKey] = useState('');
  const [adoptKey, setAdoptKey] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setError(null);
    setMessage(null);
    try {
      const result = await window.electron.vault.exportBackup();
      if (!result.canceled && result.path) setMessage(`Backup saved to ${result.path}`);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleImport = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await window.electron.vault.importBackup(null, importKey, adoptKey);
      if (result.canceled) return;
      setImportKey('');
      setMessage(
        `Imported ${result.widgets ?? 0} widget${result.widgets === 1 ? '' : 's'}.${adoptKey ? ' This vault now uses the backup master key.' : ''}`,
      );
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Section title="Export" icon={<Download size={16} />}>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Writes an encrypted <span className="font-mono">.kurugbak</span> file using your current vault key. Widget sources and theme settings are included. Passwordless backups can be restored without a key, so keep the file private.
        </p>
        <button onClick={handleExport} className="btn-primary h-9 px-4 text-xs">
          <Download size={14} />
          Export backup
        </button>
      </Section>

      <Section title="Import" icon={<Upload size={16} />}>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Decrypt a protected backup with <strong>that file’s</strong> master key, or leave the field empty for a passwordless backup. This replaces the current vault.
        </p>
        <input
          type="password"
          className="input-field h-10"
          placeholder="Backup master key (not needed for passwordless backups)"
          value={importKey}
          onChange={(e) => setImportKey(e.target.value)}
        />
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={adoptKey} onChange={(e) => setAdoptKey(e.target.checked)} />
          Keep using the backup’s master key after import
        </label>
        <button onClick={handleImport} className="btn-secondary h-9 px-4 text-xs" disabled={busy}>
          <Upload size={14} />
          Choose file & import
        </button>
        {message && <p className="text-xs" style={{ color: 'var(--success)' }}>{message}</p>}
        {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
      </Section>
    </div>
  );
}

function AboutSection() {
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'updated' | 'uptodate' | 'error'>('idle');

  const handleCheckUpdate = async () => {
    if (updateStatus === 'checking') return;
    setUpdateStatus('checking');
    try {
      const result = await window.electron.app.checkUpdate();
      if (result && result.updated) setUpdateStatus('updated');
      else {
        setUpdateStatus('uptodate');
        setTimeout(() => setUpdateStatus('idle'), 3000);
      }
    } catch {
      setUpdateStatus('uptodate');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    }
  };

  return (
    <section
      className="rounded-2xl border p-8 flex flex-col items-center justify-center space-y-4 text-center"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <img src="./logo.png" alt="Kurug Logo" className="w-12 h-12" />
      </div>
      <div>
        <h2 className="text-xl font-bold tracking-tight mt-1" style={{ color: 'var(--text-primary)' }}>Kurug</h2>
        <p className="text-xs font-medium uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>v1.0.0</p>
      </div>
      <p className="text-sm max-w-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
        A modern, cross-platform desktop widget manager. Customize your workspace freely.
      </p>
      <button
        onClick={handleCheckUpdate}
        disabled={updateStatus === 'checking'}
        className="mt-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border flex items-center justify-center min-w-[160px]"
        style={{
          background: 'var(--bg)',
          borderColor: 'var(--border)',
          color: updateStatus === 'updated' ? 'var(--success)' : 'var(--text-primary)',
          opacity: updateStatus === 'checking' ? 0.7 : 1,
        }}
      >
        {updateStatus === 'idle' && 'Check for Updates'}
        {updateStatus === 'checking' && 'Checking...'}
        {updateStatus === 'updated' && 'Update Ready (Restart)'}
        {updateStatus === 'uptodate' && 'Up to date!'}
        {updateStatus === 'error' && 'Failed to update'}
      </button>
      <div className="w-full h-px my-2" style={{ background: 'var(--border)' }} />
      <div className="flex items-center justify-center gap-4 text-sm mt-2 font-medium">
        <a href="https://github.com/osmn-byhn/kurug" target="_blank" rel="noreferrer" className="hover:underline" style={{ color: 'var(--accent)' }}>
          GitHub
        </a>
        <span style={{ color: 'var(--border)' }}>•</span>
        <a href="https://kurug.osmanbeyhan.com" target="_blank" rel="noreferrer" className="hover:underline" style={{ color: 'var(--accent)' }}>
          Website
        </a>
      </div>
    </section>
  );
}

export default Settings;
