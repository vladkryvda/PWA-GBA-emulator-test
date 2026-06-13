import { Nostalgist } from 'nostalgist';
import { SavesStorage } from '../storage/saves';
import { LibraryStorage } from '../storage/library';

// We'll wrap Nostalgist to handle loading, saving, input, etc.
export class EmulatorEngine {
  private nostalgistInstance: any = null;
  private gameId: string | null = null;
  private canvas: HTMLCanvasElement;
  private autoSaveInterval: number | null = null;
  private sessionStartTime: number = 0;
  private visibilityHandler: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.visibilityHandler = () => {
      if (document.hidden) {
        this.saveState('auto');
      }
    };
  }

  async loadGame(gameId: string) {
    this.gameId = gameId;
    const romData = await LibraryStorage.getRom(gameId);
    if (!romData) throw new Error('ROM not found');
    const state = await SavesStorage.loadState(gameId, 'auto');

    const romBlob = new Blob([romData], { type: 'application/octet-stream' });
    this.nostalgistInstance = await Nostalgist.launch({
      core: 'mgba',
      rom: { fileName: 'game.gba', fileContent: romBlob },
      element: this.canvas,
      state: state || undefined,
    });

    this.sessionStartTime = Date.now();
    this.startAutoSave();
    
    // Update last played
    await LibraryStorage.updateMetadata(gameId, { lastPlayedAt: Date.now() });
  }

  private startAutoSave() {
    this.autoSaveInterval = window.setInterval(() => {
      this.saveState('auto');
    }, 30000); // 30s
    
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private stopAutoSave() {
    if (this.autoSaveInterval) {
      window.clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }

  async saveState(type: 'auto' | 'manual' = 'auto') {
    if (!this.nostalgistInstance || !this.gameId) return;
    try {
      const state = await this.nostalgistInstance.saveState();
      await SavesStorage.saveState(this.gameId, type, state.state);
      console.log(`Saved ${type} state for ${this.gameId}`);
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }

  async exit() {
    if (this.gameId && this.sessionStartTime > 0) {
      await this.saveState('auto');
      const sessionDuration = Date.now() - this.sessionStartTime;
      const games = await LibraryStorage.getAllGames();
      const game = games.find(g => g.id === this.gameId);
      if (game) {
        await LibraryStorage.updateMetadata(this.gameId, {
          totalPlayTimeMs: (game.totalPlayTimeMs || 0) + sessionDuration
        });
      }
    }
    this.stopAutoSave();
    if (this.nostalgistInstance) {
      this.nostalgistInstance.exit();
      this.nostalgistInstance = null;
    }
    this.gameId = null;
  }

  pressButton(button: string) {
    if (this.nostalgistInstance) this.nostalgistInstance.pressDown(button);
  }

  releaseButton(button: string) {
    if (this.nostalgistInstance) this.nostalgistInstance.pressUp(button);
  }
}
