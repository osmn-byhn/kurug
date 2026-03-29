import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import type { Theme } from '../contexts/ThemeContext';
import { Sun, Moon, Palette, Info } from 'lucide-react';

interface ThemeOption {
  value: Theme;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const themeOptions: ThemeOption[] = [
  {
    value: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes in low light',
    icon: <Moon size={20} />,
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Clean and bright appearance',
    icon: <Sun size={20} />,
  },
];

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pt-2">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Customize your Kurug experience
        </p>
      </div>

      {/* Appearance */}
      <section
        className="rounded-2xl border p-6 space-y-5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <Palette size={16} style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Appearance
          </h2>
        </div>

        <div>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Theme</p>
          <div className="grid grid-cols-2 gap-3">
            {themeOptions.map((opt) => {
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className="relative flex flex-col items-start gap-3 p-4 rounded-xl border transition-all duration-150 text-left"
                  style={{
                    background: active
                      ? 'rgba(99,102,241,0.08)'
                      : 'rgba(128,128,128,0.04)',
                    borderColor: active
                      ? 'rgba(99,102,241,0.4)'
                      : 'var(--border)',
                  }}
                >
                  {/* Preview swatch */}
                  <div
                    className="w-full h-16 rounded-lg border overflow-hidden flex items-end p-2 gap-1.5"
                    style={{
                      background: opt.value === 'dark' ? '#0c0c0e' : '#f5f5f7',
                      borderColor: opt.value === 'dark'
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.06)',
                    }}
                  >
                    <div
                      className="flex-1 h-2 rounded"
                      style={{ background: opt.value === 'dark' ? '#161618' : '#ffffff' }}
                    />
                    <div className="w-4 h-4 rounded bg-indigo-500 flex-shrink-0" />
                  </div>

                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span style={{ color: active ? '#6366f1' : 'var(--text-muted)' }}>
                        {opt.icon}
                      </span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {opt.label}
                        </p>
                        <p className="text-[11px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                          {opt.description}
                        </p>
                      </div>
                    </div>
                    {/* Active indicator */}
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        borderColor: active ? '#6366f1' : 'var(--border)',
                        background: active ? '#6366f1' : 'transparent',
                      }}
                    >
                      {active && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section
        className="rounded-2xl border p-6 space-y-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <Info size={16} style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            About
          </h2>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Application', value: 'Kurug' },
            { label: 'Description', value: 'Desktop widget manager' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Settings;