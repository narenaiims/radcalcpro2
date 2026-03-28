import { openDB, IDBPDatabase } from 'idb';

export interface CalcHistoryEntry {
  id?: number;
  timestamp: number;
  calculatorId: string;
  calculatorName: string;     // Human readable: "EQD2 Calculator"
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  flags: ('warning' | 'fail')[];  // did any results fail limits?
  version: string;            // app semver for debugging
}

export interface AuditLogEntry {
  id?: number;
  timestamp: number;
  action: string;
  details: any;
  userId?: string;
}

export interface UserPreferences {
  institutionName: string;
  defaultAlphaBeta: number;
  theme: 'system' | 'dark' | 'dim';
  units: 'Gy';
}

const DB_NAME = 'radcalcpro-db';
const DB_VERSION = 2; // Upgraded version

export async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('auditLog')) {
          db.createObjectStore('auditLog', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('session')) {
          db.createObjectStore('session', { keyPath: 'calculatorId' });
        }
      }
      
      // Version 2 additions
      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences');
      }
      if (!db.objectStoreNames.contains('dismissedAlerts')) {
        db.createObjectStore('dismissedAlerts');
      }
    },
  });
}

export async function saveHistory(entry: Omit<CalcHistoryEntry, 'id'>) {
  try {
    const db = await getDB();
    return db.add('history', entry);
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}

export async function getHistory(calculatorId?: string): Promise<CalcHistoryEntry[]> {
  const db = await getDB();
  const history = await db.getAll('history');
  let filtered = history;
  if (calculatorId) {
    filtered = history.filter(h => h.calculatorId === calculatorId);
  }
  return filtered.sort((a, b) => b.timestamp - a.timestamp);
}

export async function deleteHistoryEntry(id: number) {
  const db = await getDB();
  return db.delete('history', id);
}

export async function clearAllHistory() {
  const db = await getDB();
  return db.clear('history');
}

export async function saveAuditLog(entry: Omit<AuditLogEntry, 'id'>) {
  const db = await getDB();
  return db.add('auditLog', entry);
}

export async function saveSession(calculatorId: string, inputs: any) {
  const db = await getDB();
  return db.put('session', { calculatorId, inputs, timestamp: Date.now() });
}

export async function getSession(calculatorId: string) {
  const db = await getDB();
  return db.get('session', calculatorId);
}

export async function clearSession(calculatorId: string) {
  const db = await getDB();
  return db.delete('session', calculatorId);
}

export async function savePreferences(prefs: UserPreferences) {
  const db = await getDB();
  return db.put('preferences', prefs, 'user-prefs');
}

export async function getPreferences(): Promise<UserPreferences> {
  const db = await getDB();
  const prefs = await db.get('preferences', 'user-prefs');
  return prefs || {
    institutionName: '',
    defaultAlphaBeta: 10,
    theme: 'dark',
    units: 'Gy'
  };
}

export async function dismissAlert(alertId: string) {
  const db = await getDB();
  return db.put('dismissedAlerts', true, alertId);
}

export async function isAlertDismissed(alertId: string): Promise<boolean> {
  const db = await getDB();
  return !!(await db.get('dismissedAlerts', alertId));
}

export async function clearAllData() {
  const db = await getDB();
  await db.clear('history');
  await db.clear('auditLog');
  await db.clear('session');
  await db.clear('preferences');
  await db.clear('dismissedAlerts');
}
