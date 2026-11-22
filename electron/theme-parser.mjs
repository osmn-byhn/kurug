const TELEGRAM_MAP = {
  windowBg: '--bg',
  windowFg: '--text-primary',
  windowSubTextFg: '--text-muted',
  windowSubTextFg2: '--text-secondary',
  windowBgOver: '--surface',
  windowBgRipple: '--surface-2',
  windowActiveTextFg: '--accent',
  windowBoldFg: '--text-primary',
  windowFgActive: '--text-primary',
  dialogsBg: '--bg',
  dialogsBgOver: '--surface',
  dialogsNameFg: '--text-primary',
  dialogsTextFg: '--text-secondary',
  dialogsUnreadBg: '--accent',
  titleBg: '--titlebar-bg',
  titleFg: '--text-primary',
  menuBg: '--surface',
  overlayBg: '--bg',
  boxBg: '--surface',
  boxTextFg: '--text-primary',
  activeButtonBg: '--accent',
  activeButtonBgOver: '--accent-hover',
  activeButtonFg: '--accent-fg',
  filterInputInactiveBg: '--surface-2',
  placeholderFg: '--text-muted',
  inputBorderFg: '--border-solid',
  msgInBg: '--surface',
  msgOutBg: '--surface-2',
  historyTextInFg: '--text-primary',
  sideBarBg: '--surface',
  sideBarBgOver: '--surface-2',
  sideBarTextFg: '--text-secondary',
};

function argbToCss(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const unsigned = n < 0 ? n + 0x100000000 : n;
  const a = (unsigned >>> 24) & 255;
  const r = (unsigned >>> 16) & 255;
  const g = (unsigned >>> 8) & 255;
  const b = unsigned & 255;
  if (a === 255) {
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  }
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
}

function telegramColorToCss(raw) {
  const value = String(raw).trim().replace(/;$/, '');
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
    if (value.length === 9) {
      const a = parseInt(value.slice(1, 3), 16);
      const r = parseInt(value.slice(3, 5), 16);
      const g = parseInt(value.slice(5, 7), 16);
      const b = parseInt(value.slice(7, 9), 16);
      if (a === 255) return `#${value.slice(3)}`;
      return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
    }
    return value;
  }
  if (/^-?\d+$/.test(value)) return argbToCss(value);
  if (/^rgba?\(/i.test(value)) return value;
  return null;
}

function parseTelegramTheme(text) {
  const vars = {};
  const lines = String(text).split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z0-9_]+)\s*:\s*(.+)$/);
    if (!match) continue;
    const cssVar = TELEGRAM_MAP[match[1]];
    const color = telegramColorToCss(match[2]);
    if (cssVar && color && vars[cssVar] === undefined) vars[cssVar] = color;
  }
  return vars;
}

function parseAttheme(text) {
  const vars = {};
  const lines = String(text).split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;
    const match = trimmed.match(/^W?([A-Za-z0-9_]+)\s*=\s*(.+)$/);
    if (!match) continue;
    const cssVar = TELEGRAM_MAP[match[1]];
    const color = telegramColorToCss(match[2]);
    if (cssVar && color && vars[cssVar] === undefined) vars[cssVar] = color;
  }
  return vars;
}

function parseKurugTheme(text) {
  const parsed = JSON.parse(text);
  const vars = parsed.vars || parsed.colors || parsed;
  const cleaned = {};
  for (const [key, value] of Object.entries(vars)) {
    if (typeof value !== 'string') continue;
    const name = key.startsWith('--') ? key : `--${key}`;
    cleaned[name] = value;
  }
  return {
    name: parsed.name || null,
    vars: cleaned,
    css: typeof parsed.css === 'string' ? parsed.css : '',
  };
}

function parseCssVars(text) {
  const vars = {};
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match;
  while ((match = re.exec(text))) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
}

export function parseThemeSource(filename, content) {
  const lower = String(filename || '').toLowerCase();
  const text = String(content || '');

  if (lower.endsWith('.kurug-theme') || lower.endsWith('.json')) {
    try {
      const parsed = parseKurugTheme(text);
      return { name: parsed.name || filename, vars: parsed.vars, css: parsed.css, format: 'kurug' };
    } catch {
      /* fall through */
    }
  }

  if (lower.endsWith('.tdesktop-theme') || lower.endsWith('.tdesktop-palette')) {
    return { name: filename, vars: parseTelegramTheme(text), css: '', format: 'telegram' };
  }

  if (lower.endsWith('.attheme')) {
    return { name: filename, vars: parseAttheme(text), css: '', format: 'attheme' };
  }

  if (lower.endsWith('.css')) {
    return { name: filename, vars: parseCssVars(text), css: text, format: 'css' };
  }

  if (text.includes('windowBg') || text.includes('windowFg')) {
    return { name: filename, vars: parseTelegramTheme(text), css: '', format: 'telegram' };
  }

  try {
    const parsed = parseKurugTheme(text);
    return { name: parsed.name || filename, vars: parsed.vars, css: parsed.css, format: 'kurug' };
  } catch {
    const vars = parseCssVars(text);
    return { name: filename, vars, css: Object.keys(vars).length ? '' : text, format: 'css' };
  }
}
