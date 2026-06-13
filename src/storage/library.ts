import { getDB, GameMetadata, GameROM, GameCover } from './db';

const generateId = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16) + Date.now().toString(16);
};

export class LibraryStorage {
  static async addGame(file: File): Promise<string> {
    const id = generateId(file.name);
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    let internalTitle = '';
    if (data.length > 0xAB) {
      for (let i = 0xA0; i <= 0xAB; i++) {
        if (data[i] === 0) break;
        internalTitle += String.fromCharCode(data[i]);
      }
    }
    internalTitle = internalTitle.trim();
    const title = internalTitle || file.name.replace(/\.gba$/i, '').trim();

    const db = await getDB();
    const tx = db.transaction(['metadata', 'roms'], 'readwrite');

    const metadata: GameMetadata = {
      id,
      title,
      addedAt: Date.now(),
      lastPlayedAt: 0,
      totalPlayTimeMs: 0,
    };

    const rom: GameROM = {
      id,
      data,
    };

    await Promise.all([
      tx.objectStore('metadata').put(metadata),
      tx.objectStore('roms').put(rom),
      tx.done
    ]);

    return id;
  }

  static async getAllGames(): Promise<GameMetadata[]> {
    const db = await getDB();
    const games = await db.getAllFromIndex('metadata', 'lastPlayedAt');
    return games.reverse(); // Newest first
  }

  static async getRom(id: string): Promise<Uint8Array | undefined> {
    const db = await getDB();
    const rom = await db.get('roms', id);
    return rom?.data;
  }

  static async updateMetadata(id: string, updates: Partial<GameMetadata>) {
    const db = await getDB();
    const tx = db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    const game = await store.get(id);
    if (game) {
      Object.assign(game, updates);
      await store.put(game);
    }
    await tx.done;
  }

  static async deleteGame(id: string) {
    const db = await getDB();
    const tx = db.transaction(['metadata', 'roms', 'covers', 'saves'], 'readwrite');
    await tx.objectStore('metadata').delete(id);
    await tx.objectStore('roms').delete(id);
    await tx.objectStore('covers').delete(id);
    
    // Delete saves
    const savesStore = tx.objectStore('saves');
    const saveIndex = savesStore.index('by-game');
    let cursor = await saveIndex.openCursor(id);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    
    await tx.done;
  }
}
