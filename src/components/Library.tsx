import React, { useEffect, useState, useRef } from 'react';
import { LibraryStorage } from '../storage/library';
import { GameMetadata } from '../storage/db';

interface LibraryProps {
  onLaunchGame: (id: string) => void;
}

export function Library({ onLaunchGame }: LibraryProps) {
  const [games, setGames] = useState<GameMetadata[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadGames = async () => {
    const allGames = await LibraryStorage.getAllGames();
    setGames(allGames);
  };

  useEffect(() => {
    loadGames();
  }, []);

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (data.games) {
          for (const gameData of data.games) {
            const buffer = new Uint8Array(atob(gameData.romBase64).split('').map(c => c.charCodeAt(0)));
            await LibraryStorage.addGame(new File([buffer], gameData.metadata.title + '.gba'));
          }
          await loadGames();
        }
      } catch (err) {
        console.error('Failed to import', err);
      }
    };
    input.click();
  };

  const arrayBufferToBase64 = (buffer: Uint8Array) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const handleExport = async () => {
    const games = await LibraryStorage.getAllGames();
    const exportData = { games: [] as any[] };
    
    for (const game of games) {
      const rom = await LibraryStorage.getRom(game.id);
      exportData.games.push({
        metadata: game,
        romBase64: rom ? arrayBufferToBase64(rom) : null,
      });
    }

    const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aurora_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.gba')) {
      await LibraryStorage.addGame(file);
      await loadGames();
    }
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const formatLastPlayed = (ts: number) => {
    if (ts === 0) return 'Never';
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Library</h1>
        <div style={styles.actions}>
          <button style={styles.secondaryButton} onClick={handleImportClick}>
            Import
          </button>
          <button style={styles.secondaryButton} onClick={handleExport}>
            Export
          </button>
          <button style={styles.addButton} onClick={handleAddClick}>
            Add Game
          </button>
        </div>
        <input 
          type="file" 
          accept=".gba" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />
      </header>

      {games.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No games yet. Tap Add Game to import a .gba file.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {games.map(game => (
            <div key={game.id} style={styles.card} onClick={() => onLaunchGame(game.id)}>
              <div style={styles.coverPlaceholder}>
                {game.title.charAt(0).toUpperCase()}
              </div>
              <div style={styles.cardInfo}>
                <h3 style={styles.cardTitle}>{game.title}</h3>
                <p style={styles.cardDetail}>Played: {formatTime(game.totalPlayTimeMs)}</p>
                <p style={styles.cardDetail}>Last played: {formatLastPlayed(game.lastPlayedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    height: '100%',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 600,
  },
  secondaryButton: {
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    padding: '12px 24px',
    borderRadius: '100px',
    fontWeight: 600,
    fontSize: '16px',
    boxShadow: 'var(--shadow-sm)',
  },
  addButton: {
    backgroundColor: 'var(--accent-primary)',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '100px',
    fontWeight: 600,
    fontSize: '16px',
    boxShadow: 'var(--shadow-sm)',
  },
  emptyState: {
    textAlign: 'center',
    marginTop: '64px',
    color: 'var(--text-secondary)',
    fontSize: '18px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
  },
  coverPlaceholder: {
    height: '160px',
    backgroundColor: 'var(--accent-primary)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '64px',
    color: '#fff',
    fontWeight: 'bold',
  },
  cardInfo: {
    padding: '16px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  cardDetail: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
};
