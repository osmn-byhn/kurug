/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  PRESETS,
  mergeThemeVars,
  isLightTheme,
  type ThemePresetId,
  type ThemeVars,
} from '../lib/theme-presets';

interface ThemeContextValue {
  preset: ThemePresetId;
  vars: ThemeVars;
  customCss: string;
  importedName: string | null;
  setPreset: (id: ThemePresetId) => void;
  setVar: (key: keyof ThemeVars, value: string) => void;
  setVars: (vars: Partial<ThemeVars>) => void;
  setCustomCss: (css: string) => void;
  applyImported: (name: string, vars: Partial<ThemeVars>, css?: string) => void;
  resetCustomization: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

function isPreset(id: string): id is ThemePresetId {
  return id in PRESETS;
}

function applyToDom(vars: ThemeVars, customCss: string) {
  const root = document.documentElement;
  root.setAttribute('data-theme', isLightTheme(vars) ? 'light' : 'dark');
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }

  let style = document.getElementById('kurug-custom-css') as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = 'kurug-custom-css';
    document.head.appendChild(style);
  }
  style.textContent = customCss || '';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, generation } = useAuth();
  const [preset, setPresetState] = useState<ThemePresetId>('dark');
  const [overrides, setOverrides] = useState<Partial<ThemeVars> | null>(null);
  const [customCss, setCustomCssState] = useState('');
  const [importedName, setImportedName] = useState<string | null>(null);
  const persistTimer = useRef<number | null>(null);

  const vars = useMemo(() => mergeThemeVars(PRESETS[preset], overrides), [preset, overrides]);

  const persist = useCallback((next: {
    themePreset: string;
    themeVars: Partial<ThemeVars> | null;
    customCss: string;
    importedThemeName: string | null;
  }) => {
    if (state !== 'unlocked') return;
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      window.electron.vault.setSettings(next).catch(console.error);
    }, 220);
  }, [state]);

  useEffect(() => {
    applyToDom(vars, customCss);
  }, [vars, customCss]);

  useEffect(() => {
    if (state !== 'unlocked') return;
    let cancelled = false;
    window.electron.vault.settings().then((settings) => {
      if (cancelled) return;
      const nextPreset = isPreset(settings.themePreset) ? settings.themePreset : 'dark';
      setPresetState(nextPreset);
      setOverrides(settings.themeVars as Partial<ThemeVars> | null);
      setCustomCssState(settings.customCss || '');
      setImportedName(settings.importedThemeName);
    }).catch(console.error);
    return () => { cancelled = true; };
  }, [state, generation]);

  const commit = useCallback((
    nextPreset: ThemePresetId,
    nextOverrides: Partial<ThemeVars> | null,
    nextCss: string,
    nextImported: string | null,
  ) => {
    persist({
      themePreset: nextPreset,
      themeVars: nextOverrides,
      customCss: nextCss,
      importedThemeName: nextImported,
    });
  }, [persist]);

  const setPreset = useCallback((id: ThemePresetId) => {
    setPresetState(id);
    setOverrides(null);
    setImportedName(null);
    commit(id, null, customCss, null);
  }, [commit, customCss]);

  const setVar = useCallback((key: keyof ThemeVars, value: string) => {
    setOverrides((prev) => {
      const next = { ...(prev || {}), [key]: value };
      commit(preset, next, customCss, importedName);
      return next;
    });
  }, [commit, preset, customCss, importedName]);

  const setVars = useCallback((partial: Partial<ThemeVars>) => {
    setOverrides((prev) => {
      const next = { ...(prev || {}), ...partial };
      commit(preset, next, customCss, importedName);
      return next;
    });
  }, [commit, preset, customCss, importedName]);

  const setCustomCss = useCallback((css: string) => {
    setCustomCssState(css);
    commit(preset, overrides, css, importedName);
  }, [commit, preset, overrides, importedName]);

  const applyImported = useCallback((name: string, importedVars: Partial<ThemeVars>, css = '') => {
    setImportedName(name);
    setOverrides(importedVars);
    if (css) setCustomCssState(css);
    commit(preset, importedVars, css || customCss, name);
  }, [commit, preset, customCss]);

  const resetCustomization = useCallback(() => {
    setOverrides(null);
    setCustomCssState('');
    setImportedName(null);
    commit(preset, null, '', null);
  }, [commit, preset]);

  const value = useMemo(
    () => ({
      preset,
      vars,
      customCss,
      importedName,
      setPreset,
      setVar,
      setVars,
      setCustomCss,
      applyImported,
      resetCustomization,
    }),
    [preset, vars, customCss, importedName, setPreset, setVar, setVars, setCustomCss, applyImported, resetCustomization],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
