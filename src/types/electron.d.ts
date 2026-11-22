export interface WidgetOptions {
  width: number;
  height: number;
  x: number;
  y: number;
  opacity?: number;
  interactive?: boolean;
  scroll?: boolean;
  blur?: number;
  [key: string]: unknown;
}

export interface Widget {
  id: string;
  name: string;
  type: 'git' | 'url' | 'local' | string;
  source: string;
  path: string;
  active: boolean;
  options: WidgetOptions;
}

export interface VaultStatus {
  setup: boolean;
  unlocked: boolean;
  passwordless: boolean;
  failedAttempts: number;
  failThreshold: number;
  failAction: 'none' | 'wipe' | 'backup-wipe';
  panicBackupDir: string;
  remainingAttempts: number | null;
}

export interface UnlockResult {
  ok: boolean;
  wiped?: boolean;
  backupPath?: string | null;
  action?: string;
  remainingAttempts?: number | null;
  failedAttempts?: number;
  failThreshold?: number;
}

export interface AppSettings {
  themePreset: string;
  themeVars: Record<string, string> | null;
  customCss: string;
  importedThemeName: string | null;
}

export interface ElectronAPI {
  app: { checkUpdate: () => Promise<{ updated?: boolean }> };
  windowControls: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
  vault: {
    status: () => Promise<VaultStatus>;
    setup: (password: string) => Promise<VaultStatus>;
    unlock: (password: string) => Promise<UnlockResult>;
    lock: () => Promise<VaultStatus>;
    changePassword: (currentPassword: string, nextPassword: string) => Promise<{ ok: boolean }>;
    disablePassword: (currentPassword: string) => Promise<{ ok: boolean }>;
    security: () => Promise<Pick<VaultStatus, 'failThreshold' | 'failAction' | 'panicBackupDir'>>;
    setSecurity: (payload: Partial<Pick<VaultStatus, 'failThreshold' | 'failAction' | 'panicBackupDir'>>) => Promise<unknown>;
    settings: () => Promise<AppSettings>;
    setSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;
    exportBackup: () => Promise<{ canceled: boolean; path?: string }>;
    importBackup: (filePath: string | null, backupPassword: string, adoptKey?: boolean) => Promise<{
      canceled?: boolean;
      ok?: boolean;
      adoptedKey?: boolean;
      widgets?: number;
    }>;
  };
  theme: {
    pickFile: () => Promise<{
      path: string;
      name: string;
      vars: Record<string, string>;
      css: string;
      format: string;
    } | null>;
    parse: (filename: string, content: string) => Promise<{
      name: string;
      vars: Record<string, string>;
      css: string;
      format: string;
    }>;
  };
  widget: {
    list: () => Promise<Widget[]>;
    create: (source: string, options?: Record<string, unknown>) => Promise<Widget>;
    activate: (id: string) => Promise<unknown>;
    deactivate: (id: string) => Promise<unknown>;
    toggleAll: (activate: boolean) => Promise<unknown>;
    remove: (id: string) => Promise<unknown>;
    get: (id: string) => Promise<Widget | null>;
    update: (id: string, updates: Record<string, unknown>) => Promise<Widget>;
    getConfig: (id: string) => Promise<{ css: Record<string, string>; js: Record<string, string>; env: Record<string, string>; widget: Record<string, string> }>;
    setConfig: (id: string, config: { css: Record<string, string>; js: Record<string, string>; env: Record<string, string>; widget: Record<string, string> }) => Promise<unknown>;
    pull: (id: string) => Promise<unknown>;
    checkUpdate: (id: string) => Promise<{ hasUpdate: boolean; count: number }>;
  };
  dialog: {
    openFolder: () => Promise<string | null>;
    openWidgetSource: () => Promise<string | null>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
