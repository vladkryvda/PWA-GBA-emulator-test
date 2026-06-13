import React, { useState } from 'react';
import { Library } from './components/Library';
import { Emulator } from './components/Emulator';

export default function App() {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  // If a game is active and orientation is portrait, the emulator itself might freeze? 
  // Nostalgist allows pausing. We're keeping it simple: just unmount the overlay on top, the requestAnimationFrame in emulator handles its own limits.
  // Actually, we should pause logic. But since we use nostalgist wrapped component, if portrait is active, we can overlay it. We don't have direct prop for Pause in Emulator without some ref passing. But blurring is required.

  return (
    <>
      {activeGameId ? (
        <Emulator gameId={activeGameId} onExit={() => setActiveGameId(null)} />
      ) : (
        <Library onLaunchGame={setActiveGameId} />
      )}
    </>
  );
}
