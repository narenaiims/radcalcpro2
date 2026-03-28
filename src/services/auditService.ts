const DB_NAME = 'RadOncAuditDB';
const STORE_NAME = 'calculations';

export const saveCalculation = async (data: any) => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add({ ...data, timestamp: Date.now() });
};

export const getRecentCalculations = async (limit = 50): Promise<any[]> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result.slice(-limit).reverse());
  });
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { autoIncrement: true });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
