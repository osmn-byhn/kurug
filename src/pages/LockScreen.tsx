import React, { useState } from 'react';
import { Loader, Lock, ShieldAlert, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LockScreen: React.FC = () => {
  const { state, status, panic, setup, unlock, refresh } = useAuth();
  const isSetup = state === 'needs-setup';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const remaining = status?.remainingAttempts;
  const threshold = status?.failThreshold ?? 0;
  const destructive = !isSetup && threshold > 0 && status?.failAction !== 'none';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if ((!isSetup && !status?.passwordless && password.length < 6) || (isSetup && password.length > 0 && password.length < 6)) {
      setError('Master key must be at least 6 characters.');
      return;
    }

    if (isSetup && password && password !== confirm) {
      setError('Keys do not match.');
      return;
    }

    setBusy(true);
    try {
      if (isSetup) {
        await setup(password);
      } else {
        const result = await unlock(password);
        if (!result.ok) {
          if (result.wiped) {
            setPassword('');
            setConfirm('');
            setError(
              result.backupPath
                ? `Too many failed attempts. Data was wiped. Encrypted backup saved to ${result.backupPath}`
                : 'Too many failed attempts. All data was wiped.',
            );
          } else if (result.remainingAttempts != null) {
            setError(`Wrong master key. ${result.remainingAttempts} attempt${result.remainingAttempts === 1 ? '' : 's'} left.`);
          } else {
            setError('Wrong master key.');
          }
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (state === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader className="animate-spin" size={28} style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border p-7 space-y-5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
          >
            {isSetup ? <KeyRound size={22} style={{ color: 'var(--accent)' }} /> : <Lock size={22} style={{ color: 'var(--accent)' }} />}
          </div>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {isSetup ? 'Create a master key' : 'Unlock Kurug'}
            </h1>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {isSetup
                ? 'Add a master key, or leave it empty to open Kurug without a password.'
                : 'Enter your master key to decrypt the vault.'}
            </p>
          </div>
        </div>

        {panic?.wiped && (
          <div
            className="flex gap-2.5 rounded-xl border px-3 py-2.5 text-xs leading-relaxed"
            style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: 'var(--danger)' }}
          >
            <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
            <span>
              Vault was wiped after too many failed unlocks.
              {panic.backupPath ? ` Encrypted backup: ${panic.backupPath}` : ''}
            </span>
          </div>
        )}

        <div className="space-y-3">
          <input
            type="password"
            className="input-field h-11"
            placeholder={isSetup ? 'New master key (optional)' : status?.passwordless ? 'No master key required' : 'Master key'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            disabled={busy}
          />
          {isSetup && (
            <input
              type="password"
              className="input-field h-11"
              placeholder="Confirm master key"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={busy}
            />
          )}
        </div>

        {error && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--danger)' }}>{error}</p>
        )}

        {destructive && remaining != null && (
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {status?.failAction === 'backup-wipe'
              ? `${remaining} attempt${remaining === 1 ? '' : 's'} left before an encrypted backup is saved and the vault is wiped.`
              : `${remaining} attempt${remaining === 1 ? '' : 's'} left before the vault is wiped.`}
          </p>
        )}

        <button type="submit" className="btn-primary w-full h-11 text-sm" disabled={busy}>
          {busy ? <Loader className="animate-spin" size={16} /> : isSetup ? 'Create vault' : 'Unlock'}
        </button>

        {isSetup && (
          <button
            type="button"
            className="btn-secondary w-full h-10 text-xs"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const result = await window.electron.vault.importBackup(null, password, true);
                if (result.canceled) return;
                await refresh();
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Restore encrypted backup
          </button>
        )}
      </form>
    </div>
  );
};

export default LockScreen;
