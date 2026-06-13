import { getDB, GameSave } from './db';

export class SavesStorage {
  static async saveState(gameId: string, type: 'auto' | 'manual', data: Uint8Array) {
    const db = await getDB();
    const id = `${gameId}_${type}`;
    const save: GameSave = {
      id,
      gameId,
      type,
      timestamp: Date.now(),
      data,
    };
    await db.put('saves', save);
  }

  static async loadState(gameId: string, type: 'auto' | 'manual'): Promise<Uint8Array | undefined> {
    const db = await getDB();
    const id = `${gameId}_${type}`;
    const save = await db.get('saves', id);
    return save?.data;
  }
}
