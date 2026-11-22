export interface ThemeVars {
  '--bg': string;
  '--surface': string;
  '--surface-2': string;
  '--border': string;
  '--text-primary': string;
  '--text-secondary': string;
  '--text-muted': string;
  '--accent': string;
  '--accent-hover': string;
  '--accent-fg': string;
  '--success': string;
  '--danger': string;
  '--titlebar-bg': string;
}

export type ThemePresetId =
  | 'dark'
  | 'light'
  | 'midnight'
  | 'nord'
  | 'catppuccin'
  | 'dracula'
  | 'tokyo'
  | 'graphite';

export const THEME_KEYS: (keyof ThemeVars)[] = [
  '--bg',
  '--surface',
  '--surface-2',
  '--border',
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--accent',
  '--accent-hover',
  '--accent-fg',
  '--success',
  '--danger',
  '--titlebar-bg',
];

export const THEME_LABELS: Record<keyof ThemeVars, string> = {
  '--bg': 'Background',
  '--surface': 'Surface',
  '--surface-2': 'Surface raised',
  '--border': 'Border',
  '--text-primary': 'Text',
  '--text-secondary': 'Secondary text',
  '--text-muted': 'Muted text',
  '--accent': 'Accent',
  '--accent-hover': 'Accent hover',
  '--accent-fg': 'Accent contrast',
  '--success': 'Success',
  '--danger': 'Danger',
  '--titlebar-bg': 'Title bar',
};

export const PRESETS: Record<ThemePresetId, ThemeVars> = {
  dark: {
    '--bg': '#0c0c0e',
    '--surface': '#161618',
    '--surface-2': '#1e1e22',
    '--border': 'rgba(255, 255, 255, 0.08)',
    '--text-primary': '#f3f4f6',
    '--text-secondary': '#9ca3af',
    '--text-muted': '#4b5563',
    '--accent': '#6366f1',
    '--accent-hover': '#818cf8',
    '--accent-fg': '#ffffff',
    '--success': '#10b981',
    '--danger': '#ef4444',
    '--titlebar-bg': '#161618',
  },
  light: {
    '--bg': '#f5f5f7',
    '--surface': '#ffffff',
    '--surface-2': '#ececef',
    '--border': 'rgba(0, 0, 0, 0.08)',
    '--text-primary': '#111118',
    '--text-secondary': '#4b5563',
    '--text-muted': '#9ca3af',
    '--accent': '#4f46e5',
    '--accent-hover': '#6366f1',
    '--accent-fg': '#ffffff',
    '--success': '#059669',
    '--danger': '#dc2626',
    '--titlebar-bg': '#ffffff',
  },
  midnight: {
    '--bg': '#070b14',
    '--surface': '#0f172a',
    '--surface-2': '#1e293b',
    '--border': 'rgba(148, 163, 184, 0.16)',
    '--text-primary': '#e2e8f0',
    '--text-secondary': '#94a3b8',
    '--text-muted': '#64748b',
    '--accent': '#38bdf8',
    '--accent-hover': '#7dd3fc',
    '--accent-fg': '#0b1220',
    '--success': '#34d399',
    '--danger': '#fb7185',
    '--titlebar-bg': '#0f172a',
  },
  nord: {
    '--bg': '#2e3440',
    '--surface': '#3b4252',
    '--surface-2': '#434c5e',
    '--border': 'rgba(216, 222, 233, 0.12)',
    '--text-primary': '#eceff4',
    '--text-secondary': '#d8dee9',
    '--text-muted': '#81a1c1',
    '--accent': '#88c0d0',
    '--accent-hover': '#8fbcbb',
    '--accent-fg': '#2e3440',
    '--success': '#a3be8c',
    '--danger': '#bf616a',
    '--titlebar-bg': '#3b4252',
  },
  catppuccin: {
    '--bg': '#1e1e2e',
    '--surface': '#313244',
    '--surface-2': '#45475a',
    '--border': 'rgba(205, 214, 244, 0.12)',
    '--text-primary': '#cdd6f4',
    '--text-secondary': '#a6adc8',
    '--text-muted': '#6c7086',
    '--accent': '#cba6f7',
    '--accent-hover': '#f5c2e7',
    '--accent-fg': '#1e1e2e',
    '--success': '#a6e3a1',
    '--danger': '#f38ba8',
    '--titlebar-bg': '#313244',
  },
  dracula: {
    '--bg': '#282a36',
    '--surface': '#343746',
    '--surface-2': '#44475a',
    '--border': 'rgba(248, 248, 242, 0.12)',
    '--text-primary': '#f8f8f2',
    '--text-secondary': '#bd93f9',
    '--text-muted': '#6272a4',
    '--accent': '#ff79c6',
    '--accent-hover': '#ff92d0',
    '--accent-fg': '#282a36',
    '--success': '#50fa7b',
    '--danger': '#ff5555',
    '--titlebar-bg': '#343746',
  },
  tokyo: {
    '--bg': '#1a1b26',
    '--surface': '#24283b',
    '--surface-2': '#414868',
    '--border': 'rgba(192, 202, 245, 0.12)',
    '--text-primary': '#c0caf5',
    '--text-secondary': '#a9b1d6',
    '--text-muted': '#565f89',
    '--accent': '#7aa2f7',
    '--accent-hover': '#89b4fa',
    '--accent-fg': '#1a1b26',
    '--success': '#9ece6a',
    '--danger': '#f7768e',
    '--titlebar-bg': '#24283b',
  },
  graphite: {
    '--bg': '#121212',
    '--surface': '#1c1c1c',
    '--surface-2': '#262626',
    '--border': 'rgba(255, 255, 255, 0.08)',
    '--text-primary': '#f5f5f5',
    '--text-secondary': '#a3a3a3',
    '--text-muted': '#737373',
    '--accent': '#d4d4d4',
    '--accent-hover': '#e5e5e5',
    '--accent-fg': '#171717',
    '--success': '#86efac',
    '--danger': '#fca5a5',
    '--titlebar-bg': '#1c1c1c',
  },
};

export const PRESET_META: { id: ThemePresetId; label: string; description: string }[] = [
  { id: 'dark', label: 'Dark', description: 'Default low-light look' },
  { id: 'light', label: 'Light', description: 'Clean and bright' },
  { id: 'midnight', label: 'Midnight', description: 'Deep navy, sky accent' },
  { id: 'nord', label: 'Nord', description: 'Arctic, muted blues' },
  { id: 'catppuccin', label: 'Catppuccin', description: 'Pastel mocha palette' },
  { id: 'dracula', label: 'Dracula', description: 'Pink on charcoal' },
  { id: 'tokyo', label: 'Tokyo Night', description: 'Cool blue city night' },
  { id: 'graphite', label: 'Graphite', description: 'Monochrome studio' },
];

export function mergeThemeVars(base: ThemeVars, overlay?: Partial<ThemeVars> | null): ThemeVars {
  return { ...base, ...(overlay || {}) };
}

export function luminance(color: string): number {
  const hex = color.trim();
  let r = 12;
  let g = 12;
  let b = 14;
  const short = /^#([0-9a-f]{3})$/i.exec(hex);
  const long = /^#([0-9a-f]{6})$/i.exec(hex);
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(hex);
  if (long) {
    r = parseInt(long[1].slice(0, 2), 16);
    g = parseInt(long[1].slice(2, 4), 16);
    b = parseInt(long[1].slice(4, 6), 16);
  } else if (short) {
    r = parseInt(short[1][0] + short[1][0], 16);
    g = parseInt(short[1][1] + short[1][1], 16);
    b = parseInt(short[1][2] + short[1][2], 16);
  } else if (rgb) {
    r = Number(rgb[1]);
    g = Number(rgb[2]);
    b = Number(rgb[3]);
  }
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function isLightTheme(vars: ThemeVars): boolean {
  return luminance(vars['--bg']) > 0.55;
}

export function toHexColor(value: string): string {
  const hex = value.trim();
  const long = /^#([0-9a-f]{6})$/i.exec(hex);
  if (long) return `#${long[1]}`;
  const short = /^#([0-9a-f]{3})$/i.exec(hex);
  if (short) {
    return `#${short[1][0]}${short[1][0]}${short[1][1]}${short[1][1]}${short[1][2]}${short[1][2]}`;
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(hex);
  if (rgb) {
    const to = (n: number) => n.toString(16).padStart(2, '0');
    return `#${to(Number(rgb[1]))}${to(Number(rgb[2]))}${to(Number(rgb[3]))}`;
  }
  return '#6366f1';
}
