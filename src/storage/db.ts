import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface GameMetadata {
  id: string; // Typically a hash or safe name
  title: string;
  addedAt: number;
  lastPlayedAt: number;
  totalPlayTimeMs: number;
}

export interface GameROM {
  id: string;
  data: Uint8Array;
}

export interface GameCover {
  id: string;
  dataUrl: string; // Base64 or Blob URL
}

export interface GameSave {
  id: string; // composite key: gameId_saveType
  gameId: string;
  type: 'auto' | 'manual';
  timestamp: number;
  data: Uint8Array;
}

interface AuroraDB extends DBSchema {
  metadata: {
    key: string;
    value: GameMetadata;
    indexes: { 'lastPlayedAt': number };
  };
  roms: {
    key: string;
    value: GameROM;
  };
  covers: {
    key: string;
    value: GameCover;
  };
  saves: {
    key: string;
    value: GameSave;
    indexes: { 'by-game': string };
  };
}

let dbPromise: Promise<IDBPDatabase<AuroraDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<AuroraDB>('aurora-gba-db', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('metadata')) {
          const store = db.createObjectStore('metadata', { keyPath: 'id' });
          store.createIndex('lastPlayedAt', 'lastPlayedAt');
        }
        if (!db.objectStoreNames.contains('roms')) {
          db.createObjectStore('roms', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('covers')) {
          db.createObjectStore('covers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('saves')) {
          const store = db.createObjectStore('saves', { keyPath: 'id' });
          store.createIndex('by-game', 'gameId');
        }
      },
    });
  }
  return dbPromise;
}
