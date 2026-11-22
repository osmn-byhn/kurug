import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  BACKUP_MAGIC,
  SCRYPT,
  deriveKey,
  encryptJson,
  decryptJson,
  makeVerifier,
  timingSafeEqualStr,
  atomicWrite,
  emptyPayload,
} from './crypto-util.mjs';

const DEFAULT_DATA = emptyPayload();

function defaultPanicDir() {
  return path.join(app.getPath('documents'), 'Kurug', 'panic-backups');
}

class Vault {
  constructor() {
    this.dir = null;
    this.metaPath = null;
    this.encPath = null;
    this.localKeyPath = null;
    this.legacyPath = null;
    this.widgetsDir = null;
    this.meta = null;
    this.data = null;
    this.key = null;
    this._writeTimer = null;
    this._writePromise = null;
  }

  async init() {
    this.dir = app.getPath('userData');
    this.metaPath = path.join(this.dir, 'vault.meta.json');
    this.encPath = path.join(this.dir, 'vault.enc.json');
    this.localKeyPath = path.join(this.dir, 'vault.local.key');
    this.legacyPath = path.join(this.dir, 'widgets-low.json');
    this.widgetsDir = path.join(this.dir, 'widgets');

    if (!fs.existsSync(this.widgetsDir)) {
      fs.mkdirSync(this.widgetsDir, { recursive: true });
    }

    if (fs.existsSync(this.metaPath)) {
      this.meta = JSON.parse(fs.readFileSync(this.metaPath, 'utf8'));
      if (this.meta.passwordless) {
        try { this._unlockWithLocalKey(); }
        catch (error) { console.error('Could not auto-unlock local vault:', error); }
      }
    }
  }

  get isSetup() {
    return !!(this.meta && this.meta.verifier);
  }

  get isUnlocked() {
    return !!(this.key && this.data);
  }

  status() {
    const threshold = this.meta?.failThreshold ?? 5;
    const attempts = this.meta?.failedAttempts ?? 0;
    const remaining = threshold > 0 ? Math.max(0, threshold - attempts) : null;
    return {
      setup: this.isSetup,
      unlocked: this.isUnlocked,
      passwordless: !!this.meta?.passwordless,
      failedAttempts: attempts,
      failThreshold: threshold,
      failAction: this.meta?.failAction ?? 'backup-wipe',
      panicBackupDir: this.meta?.panicBackupDir || defaultPanicDir(),
      remainingAttempts: remaining,
    };
  }

  security() {
    return {
      failThreshold: this.meta?.failThreshold ?? 5,
      failAction: this.meta?.failAction ?? 'backup-wipe',
      panicBackupDir: this.meta?.panicBackupDir || defaultPanicDir(),
    };
  }

  _writeMeta() {
    atomicWrite(this.metaPath, JSON.stringify(this.meta, null, 2));
  }

  _persistSync() {
    if (!this.key || !this.data) return;
    const payload = encryptJson(this.data, this.key);
    atomicWrite(this.encPath, JSON.stringify(payload));
  }

  schedulePersist() {
    if (this._writeTimer) clearTimeout(this._writeTimer);
    this._writeTimer = setTimeout(() => {
      this._writeTimer = null;
      try {
        this._persistSync();
      } catch (err) {
        console.error('Vault persist failed:', err);
      }
    }, 180);
  }

  async flush() {
    if (this._writeTimer) {
      clearTimeout(this._writeTimer);
      this._writeTimer = null;
    }
    this._persistSync();
  }

  _ensureDataShape(raw) {
    const data = raw && typeof raw === 'object' ? raw : {};
    if (!Array.isArray(data.widgets)) data.widgets = [];
    delete data.folders;
    data.appSettings = {
      themePreset: 'dark',
      themeVars: null,
      customCss: '',
      importedThemeName: null,
      ...(data.appSettings || {}),
    };
    for (const w of data.widgets) delete w.folderId;
    return data;
  }

  _loadLegacyWidgets() {
    if (!fs.existsSync(this.legacyPath)) return [];
    try {
      const parsed = JSON.parse(fs.readFileSync(this.legacyPath, 'utf8'));
      return Array.isArray(parsed.widgets) ? parsed.widgets : [];
    } catch {
      return [];
    }
  }

  _consumeLegacy() {
    try {
      if (fs.existsSync(this.legacyPath)) fs.unlinkSync(this.legacyPath);
    } catch { /* ignore */ }
  }

  setup(password) {
    if (this.isSetup) throw new Error('Vault is already initialized');
    const passwordValue = String(password || '');
    if (passwordValue && passwordValue.length < 6) {
      throw new Error('Master key must be at least 6 characters');
    }

    const salt = crypto.randomBytes(16);
    const passwordless = !passwordValue;
    const key = passwordless ? crypto.randomBytes(32) : deriveKey(passwordValue, salt, SCRYPT);
    const legacyWidgets = this._loadLegacyWidgets();

    this.meta = {
      version: 1,
      salt: salt.toString('base64'),
      kdf: { ...SCRYPT },
      verifier: makeVerifier(key),
      passwordless,
      failedAttempts: 0,
      failThreshold: 5,
      failAction: 'backup-wipe',
      panicBackupDir: defaultPanicDir(),
      createdAt: new Date().toISOString(),
    };

    this.key = key;
    this.data = this._ensureDataShape({
      ...DEFAULT_DATA,
      widgets: legacyWidgets,
    });

    this._writeMeta();
    if (passwordless) fs.writeFileSync(this.localKeyPath, key.toString('base64'), { mode: 0o600 });
    else if (fs.existsSync(this.localKeyPath)) fs.unlinkSync(this.localKeyPath);
    this._persistSync();
    this._consumeLegacy();
    return this.status();
  }

  async unlock(password) {
    if (!this.isSetup) throw new Error('Vault is not set up');
    if (this.isUnlocked) return { ok: true, ...this.status() };
    if (this.meta.passwordless) {
      this._unlockWithLocalKey();
      return { ok: true, wiped: false, ...this.status() };
    }

    const salt = Buffer.from(this.meta.salt, 'base64');
    const key = deriveKey(password, salt, this.meta.kdf || SCRYPT);

    if (!timingSafeEqualStr(makeVerifier(key), this.meta.verifier)) {
      this.meta.failedAttempts = (this.meta.failedAttempts || 0) + 1;
      this._writeMeta();

      const threshold = Number(this.meta.failThreshold) || 0;
      const action = this.meta.failAction || 'none';

      if (threshold > 0 && action !== 'none' && this.meta.failedAttempts >= threshold) {
        const panic = await this.panic();
        return { ok: false, wiped: true, ...panic, remainingAttempts: 0 };
      }

      const remaining = threshold > 0 ? Math.max(0, threshold - this.meta.failedAttempts) : null;
      return {
        ok: false,
        wiped: false,
        remainingAttempts: remaining,
        failedAttempts: this.meta.failedAttempts,
        failThreshold: threshold,
      };
    }

    if (!fs.existsSync(this.encPath)) {
      throw new Error('Encrypted vault file is missing');
    }

    const payload = JSON.parse(fs.readFileSync(this.encPath, 'utf8'));
    this.data = this._ensureDataShape(decryptJson(payload, key));
    this.key = key;
    this.meta.failedAttempts = 0;
    this._writeMeta();
    return { ok: true, wiped: false, ...this.status() };
  }

  lock() {
    this.flush();
    this.key = null;
    this.data = null;
    return this.status();
  }

  changePassword(currentPassword, nextPassword) {
    this._assertUnlocked();
    if (!nextPassword || String(nextPassword).length < 6) {
      throw new Error('Master key must be at least 6 characters');
    }

    if (!this.meta.passwordless) {
      if (!currentPassword) throw new Error('Current master key is required');
      const salt = Buffer.from(this.meta.salt, 'base64');
      const currentKey = deriveKey(currentPassword, salt, this.meta.kdf || SCRYPT);
      if (!timingSafeEqualStr(makeVerifier(currentKey), this.meta.verifier)) {
        throw new Error('Current master key is incorrect');
      }
    }

    const nextSalt = crypto.randomBytes(16);
    const nextKey = deriveKey(nextPassword, nextSalt, SCRYPT);
    this.meta.salt = nextSalt.toString('base64');
    this.meta.kdf = { ...SCRYPT };
    this.meta.verifier = makeVerifier(nextKey);
    this.meta.passwordless = false;
    this.key = nextKey;
    try { if (fs.existsSync(this.localKeyPath)) fs.unlinkSync(this.localKeyPath); } catch { /* ignore */ }
    this._writeMeta();
    this._persistSync();
    return { ok: true };
  }

  disablePassword(currentPassword) {
    this._assertUnlocked();
    if (!this.meta.passwordless) {
      if (!currentPassword) throw new Error('Current master key is required');
      const salt = Buffer.from(this.meta.salt, 'base64');
      const currentKey = deriveKey(currentPassword, salt, this.meta.kdf || SCRYPT);
      if (!timingSafeEqualStr(makeVerifier(currentKey), this.meta.verifier)) throw new Error('Current master key is incorrect');
    }
    const key = crypto.randomBytes(32);
    this.key = key;
    this.meta.salt = crypto.randomBytes(16).toString('base64');
    this.meta.kdf = { ...SCRYPT };
    this.meta.verifier = makeVerifier(key);
    this.meta.passwordless = true;
    fs.writeFileSync(this.localKeyPath, key.toString('base64'), { mode: 0o600 });
    this._writeMeta();
    this._persistSync();
    return { ok: true };
  }

  _unlockWithLocalKey() {
    if (!fs.existsSync(this.localKeyPath) || !fs.existsSync(this.encPath)) throw new Error('Local unlock key or vault data is missing');
    const key = Buffer.from(fs.readFileSync(this.localKeyPath, 'utf8').trim(), 'base64');
    if (key.length !== 32 || !timingSafeEqualStr(makeVerifier(key), this.meta.verifier)) throw new Error('Local unlock key is invalid');
    const payload = JSON.parse(fs.readFileSync(this.encPath, 'utf8'));
    this.data = this._ensureDataShape(decryptJson(payload, key));
    this.key = key;
  }

  setSecurity({ failThreshold, failAction, panicBackupDir }) {
    if (!this.meta) throw new Error('Vault is not set up');
    if (failThreshold !== undefined) {
      const n = Number(failThreshold);
      if (![0, 3, 5].includes(n)) throw new Error('Threshold must be 0, 3, or 5');
      this.meta.failThreshold = n;
    }
    if (failAction !== undefined) {
      if (!['none', 'wipe', 'backup-wipe'].includes(failAction)) {
        throw new Error('Invalid fail action');
      }
      this.meta.failAction = failAction;
    }
    if (panicBackupDir !== undefined) {
      this.meta.panicBackupDir = panicBackupDir || defaultPanicDir();
    }
    this._writeMeta();
    return this.security();
  }

  getAppSettings() {
    this._assertUnlocked();
    return { ...this.data.appSettings };
  }

  setAppSettings(partial) {
    this._assertUnlocked();
    this.data.appSettings = { ...this.data.appSettings, ...partial };
    this.schedulePersist();
    return { ...this.data.appSettings };
  }

  buildBackupObject() {
    this._assertUnlocked();
    this._persistSync();
    const enc = JSON.parse(fs.readFileSync(this.encPath, 'utf8'));
    return {
      magic: BACKUP_MAGIC,
      version: 1,
      exportedAt: new Date().toISOString(),
      kdf: this.meta.kdf,
      salt: this.meta.salt,
      verifier: this.meta.verifier,
      passwordless: !!this.meta.passwordless,
      ...(this.meta.passwordless ? { localKey: this.key.toString('base64') } : {}),
      failThreshold: this.meta.failThreshold,
      failAction: this.meta.failAction,
      payload: enc,
    };
  }

  writeBackupFile(destPath) {
    const backup = this.buildBackupObject();
    atomicWrite(destPath, JSON.stringify(backup));
    if (this.meta.passwordless) fs.chmodSync(destPath, 0o600);
    return destPath;
  }

  _copyEncryptedBackup(destPath) {
    if (!fs.existsSync(this.encPath) || !this.meta) {
      throw new Error('Nothing to back up');
    }
    const enc = JSON.parse(fs.readFileSync(this.encPath, 'utf8'));
    const backup = {
      magic: BACKUP_MAGIC,
      version: 1,
      exportedAt: new Date().toISOString(),
      kdf: this.meta.kdf,
      salt: this.meta.salt,
      verifier: this.meta.verifier,
      passwordless: !!this.meta.passwordless,
      ...(this.meta.passwordless ? { localKey: this.key.toString('base64') } : {}),
      failThreshold: this.meta.failThreshold,
      failAction: this.meta.failAction,
      payload: enc,
      panic: true,
    };
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    atomicWrite(destPath, JSON.stringify(backup));
    if (this.meta.passwordless) fs.chmodSync(destPath, 0o600);
    return destPath;
  }

  async panic() {
    const action = this.meta?.failAction || 'wipe';
    let backupPath = null;

    if (action === 'backup-wipe') {
      try {
        const dir = this.meta.panicBackupDir || defaultPanicDir();
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        backupPath = path.join(dir, `kurug-panic-${stamp}.kurugbak`);
        this._copyEncryptedBackup(backupPath);
      } catch (err) {
        console.error('Panic backup failed:', err);
        backupPath = null;
      }
    }

    await this.wipeAll();
    return { backupPath, action };
  }

  async wipeAll() {
    if (this._writeTimer) {
      clearTimeout(this._writeTimer);
      this._writeTimer = null;
    }
    this.key = null;
    this.data = null;
    this.meta = null;

    const victims = [this.metaPath, this.encPath, this.legacyPath, this.localKeyPath];
    for (const file of victims) {
      try {
        if (file && fs.existsSync(file)) fs.unlinkSync(file);
      } catch { /* ignore */ }
    }

    try {
      if (this.widgetsDir && fs.existsSync(this.widgetsDir)) {
        fs.rmSync(this.widgetsDir, { recursive: true, force: true });
        fs.mkdirSync(this.widgetsDir, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to wipe widgets dir:', err);
    }
  }

  importBackup(filePath, backupPassword, { adoptKey = true } = {}) {
    if (!fs.existsSync(filePath)) throw new Error('Backup file not found');

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (raw.magic !== BACKUP_MAGIC || !raw.payload || !raw.salt) {
      throw new Error('Not a valid Kurug backup');
    }

    let key;
    if (raw.passwordless && raw.localKey) key = Buffer.from(raw.localKey, 'base64');
    else {
      if (!backupPassword) throw new Error('Backup master key is required');
      const salt = Buffer.from(raw.salt, 'base64');
      key = deriveKey(backupPassword, salt, raw.kdf || SCRYPT);
    }

    if (raw.verifier && !timingSafeEqualStr(makeVerifier(key), raw.verifier)) {
      throw new Error('Backup master key is incorrect');
    }

    let decoded;
    try {
      decoded = this._ensureDataShape(decryptJson(raw.payload, key));
    } catch {
      throw new Error('Could not decrypt backup — check the master key');
    }

    if (!this.isSetup) {
      this.meta = {
        version: 1,
        salt: raw.salt,
        kdf: raw.kdf || { ...SCRYPT },
        verifier: raw.verifier || makeVerifier(key),
        passwordless: !!raw.passwordless,
        failedAttempts: 0,
        failThreshold: raw.failThreshold ?? 5,
        failAction: raw.failAction ?? 'backup-wipe',
        panicBackupDir: defaultPanicDir(),
        createdAt: new Date().toISOString(),
      };
      this.key = key;
      this.data = decoded;
      this._writeMeta();
      if (raw.passwordless) fs.writeFileSync(this.localKeyPath, key.toString('base64'), { mode: 0o600 });
      this._persistSync();
      return { ok: true, adoptedKey: true, widgets: decoded.widgets.length };
    }

    this._assertUnlocked();

    if (adoptKey) {
      this.meta.salt = raw.salt;
      this.meta.kdf = raw.kdf || { ...SCRYPT };
      this.meta.verifier = raw.verifier || makeVerifier(key);
      this.meta.passwordless = !!raw.passwordless;
      this.key = key;
      if (raw.passwordless) fs.writeFileSync(this.localKeyPath, key.toString('base64'), { mode: 0o600 });
      else if (fs.existsSync(this.localKeyPath)) fs.unlinkSync(this.localKeyPath);
    }

    this.data = decoded;
    this._writeMeta();
    this._persistSync();
    return { ok: true, adoptedKey: !!adoptKey, widgets: decoded.widgets.length };
  }

  _assertUnlocked() {
    if (!this.isUnlocked) throw new Error('Vault is locked');
  }
}

const vault = new Vault();
export default vault;
