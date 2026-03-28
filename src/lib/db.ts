import { openDB, IDBPDatabase } from 'idb';

export interface CalcHistoryEntry {
  id?: number;
  timestamp: number;
  calculatorId: string;
  inputs: any;
  outputs: any;
  version: string;
}

export interface AuditLogEntry {
  id?: number;
  timestamp: number;
  action: string;
  details: any;
  userId?: string;
}

const DB_NAME = 'radcalcpro-db';
const DB_VERSION = 1;

export async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('auditLog')) {
        db.createObjectStore('auditLog', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('session')) {
        db.createObjectStore('session', { keyPath: 'calculatorId' });
      }
    },
  });
}

export async function saveHistory(entry: Omit<CalcHistoryEntry, 'id'>) {
  const db = await getDB();
  return db.add('history', entry);
}

export async function getHistory(calculatorId?: string): Promise<CalcHistoryEntry[]> {
  const db = await getDB();
  const history = await db.getAll('history');
  if (calculatorId) {
    return history.filter(h => h.calculatorId === calculatorId).sort((a, b) => b.timestamp - a.timestamp);
  }
  return history.sort((a, b) => b.timestamp - a.timestamp);
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
