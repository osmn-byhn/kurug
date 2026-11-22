/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { UnlockResult, VaultStatus } from '../types/electron';

type AuthState = 'loading' | 'needs-setup' | 'locked' | 'unlocked';

interface AuthContextValue {
  state: AuthState;
  status: VaultStatus | null;
  panic: { wiped: boolean; backupPath?: string | null } | null;
  generation: number;
  setup: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<UnlockResult>;
  lock: () => Promise<void>;
  disablePassword: (currentPassword: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

function applyStatus(next: VaultStatus): AuthState {
  if (!next.setup) return 'needs-setup';
  if (!next.unlocked) return 'locked';
  return 'unlocked';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>('loading');
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [panic, setPanic] = useState<{ wiped: boolean; backupPath?: string | null } | null>(null);
  const [generation, setGeneration] = useState(0);

  const apply = useCallback((next: VaultStatus) => {
    setStatus(next);
    setGeneration((g) => g + 1);
    setState(applyStatus(next));
  }, []);

  const refresh = useCallback(async () => {
    apply(await window.electron.vault.status());
  }, [apply]);

  useEffect(() => {
    let alive = true;
    window.electron.vault.status()
      .then((next) => {
        if (alive) apply(next);
      })
      .catch(() => {
        if (alive) setState('needs-setup');
      });
    return () => { alive = false; };
  }, [apply]);

  const setup = useCallback(async (password: string) => {
    apply(await window.electron.vault.setup(password));
    setPanic(null);
  }, [apply]);

  const unlock = useCallback(async (password: string) => {
    const result = await window.electron.vault.unlock(password);
    if (result.wiped) {
      setPanic({ wiped: true, backupPath: result.backupPath });
    }
    apply(await window.electron.vault.status());
    return result;
  }, [apply]);

  const lock = useCallback(async () => {
    apply(await window.electron.vault.lock());
  }, [apply]);

  const disablePassword = useCallback(async (currentPassword: string) => {
    await window.electron.vault.disablePassword(currentPassword);
    apply(await window.electron.vault.status());
  }, [apply]);

  const value = useMemo(
    () => ({ state, status, panic, generation, setup, unlock, lock, disablePassword, refresh }),
    [state, status, panic, generation, setup, unlock, lock, disablePassword, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
