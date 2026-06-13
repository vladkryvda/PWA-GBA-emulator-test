import React, { useEffect, useRef, useState } from 'react';
import { EmulatorEngine } from '../engine';

interface EmulatorProps {
  gameId: string;
  onExit: () => void;
}

export function Emulator({ gameId, onExit }: EmulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<EmulatorEngine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (canvasRef.current && !engineRef.current) {
        engineRef.current = new EmulatorEngine(canvasRef.current);
        try {
          await engineRef.current.loadGame(gameId);
          if (active) setLoading(false);
        } catch(e) {
          console.error(e);
          onExit();
        }
      }
    };
    init();

    return () => {
      active = false;
      if (engineRef.current) {
        engineRef.current.exit();
        engineRef.current = null;
      }
    };
  }, [gameId, onExit]);

  const handleStickMove = (x: number, y: number) => {
    if (!engineRef.current) return;
    
    // x and y are between -1 and 1
    const threshold = 0.3;
    
    // Map thumbstick movement to D-pad
    if (x < -threshold) { engineRef.current.pressButton('left'); engineRef.current.releaseButton('right'); }
    else if (x > threshold) { engineRef.current.pressButton('right'); engineRef.current.releaseButton('left'); }
    else { engineRef.current.releaseButton('left'); engineRef.current.releaseButton('right'); }

    if (y < -threshold) { engineRef.current.pressButton('up'); engineRef.current.releaseButton('down'); }
    else if (y > threshold) { engineRef.current.pressButton('down'); engineRef.current.releaseButton('up'); }
    else { engineRef.current.releaseButton('up'); engineRef.current.releaseButton('down'); }
  };

  const handleStickRelease = () => {
    if (!engineRef.current) return;
    ['up', 'down', 'left', 'right'].forEach(btn => engineRef.current!.releaseButton(btn));
  };

  const btnPress = (btn: string) => engineRef.current?.pressButton(btn);
  const btnRelease = (btn: string) => engineRef.current?.releaseButton(btn);

  return (
    <div style={styles.container}>
      {loading && <div style={styles.loading}>Loading...</div>}
      
      {/* Top Navigation Bar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <svg style={{ width: 24, height: 24, color: '#7F5539' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <h1 style={styles.headerTitle}>Aurora GBA</h1>
        </div>
        <div style={styles.headerRight}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
             <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, fontWeight: 'bold' }}>Battery</span>
             <span style={{ fontSize: 14, fontWeight: 500 }}>--%</span>
          </div>
          <div style={{ width: 1, height: 32, backgroundColor: 'rgba(176,137,104,0.2)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
             <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, fontWeight: 'bold' }}>Audio</span>
             <span style={{ fontSize: 14, fontWeight: 500 }}>Stereo</span>
          </div>
          <button style={styles.headerBtn} onClick={onExit}>
            Library
          </button>
        </div>
      </header>

      {/* Main Gameplay Area */}
      <main style={{ ...styles.main, visibility: loading ? 'hidden' : 'visible' }}>
        
        {/* Shoulder Buttons (L) */}
        <div 
          style={styles.shoulderL}
          onTouchStart={() => btnPress('l')}
          onTouchEnd={() => btnRelease('l')}
        ><span style={styles.shoulderText}>L Shoulder</span></div>
        
        {/* Left Control Panel: Analog Stick */}
        <div style={styles.leftPanel}>
          <Thumbstick onMove={handleStickMove} onRelease={handleStickRelease} />
        </div>

        {/* Center: GBA Screen */}
        <div style={styles.centerPanel}>
          <div style={styles.screenWrapper}>
             <div style={styles.screenInner}>
                <canvas ref={canvasRef} style={styles.canvas} />
             </div>
             <div style={styles.screenGlare} />
          </div>

          {/* Floating Select / Start Labels */}
          <div style={styles.startSelectWrapper}>
            <div style={styles.bottomPillContainer}>
              <div 
                style={styles.pillBtn}
                onTouchStart={() => btnPress('select')}
                onTouchEnd={() => btnRelease('select')}
              ></div>
              <span style={styles.pillLabel}>Select</span>
            </div>
            <div style={styles.bottomPillContainer}>
              <div 
                style={styles.pillBtn}
                onTouchStart={() => btnPress('start')}
                onTouchEnd={() => btnRelease('start')}
              ></div>
              <span style={styles.pillLabel}>Start</span>
            </div>
          </div>
        </div>

        {/* Shoulder Buttons (R) */}
        <div 
          style={styles.shoulderR}
          onTouchStart={() => btnPress('r')}
          onTouchEnd={() => btnRelease('r')}
        ><span style={styles.shoulderText}>R Shoulder</span></div>

        {/* Right Control Panel: A/B Buttons */}
        <div style={styles.rightPanel}>
          <div style={styles.abWrapper}>
            {/* B Button */}
            <div 
              style={styles.bBtn}
              onTouchStart={() => btnPress('b')}
              onTouchEnd={() => btnRelease('b')}
            ><span style={styles.abText}>B</span></div>
            {/* A Button */}
            <div 
              style={styles.aBtn}
              onTouchStart={() => btnPress('a')}
              onTouchEnd={() => btnRelease('a')}
            ><span style={styles.abTextAlt}>A</span></div>
          </div>
        </div>
      </main>

      {/* Bottom Status Bar / Controls */}
      <footer style={{ ...styles.footer, visibility: loading ? 'hidden' : 'visible' }}>
        <div style={styles.footerStatus}>
           <div style={styles.statusDot}></div>
           <span style={styles.statusText}>Stable Output</span>
        </div>
        <div style={styles.footerVersion}>
          Aurora • Natural Tones
        </div>
      </footer>
    </div>
  );
}

// Thumbstick Component
function Thumbstick({ onMove, onRelease }: { onMove: (x: number, y: number) => void, onRelease: () => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [activeInfo, setActiveInfo] = useState<{id: number, x: number, y: number} | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeInfo) return; // Already active
    const touch = e.changedTouches[0];
    updatePosition(touch);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!activeInfo) return;
    const touch = Array.from(e.changedTouches).find((t: React.Touch) => t.identifier === activeInfo.id);
    if (touch) updatePosition(touch);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!activeInfo) return;
    const touch = Array.from(e.changedTouches).find((t: React.Touch) => t.identifier === activeInfo.id);
    if (touch) {
      setActiveInfo(null);
      onRelease();
    }
  };

  const updatePosition = (touch: React.Touch) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const maxRadius = rect.width / 2;
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    
    setActiveInfo({
      id: touch.identifier,
      x: dx,
      y: dy
    });
    
    // Normalize to -1 to 1
    onMove(dx / maxRadius, dy / maxRadius);
  };

  return (
    <div 
      ref={baseRef}
      style={styles.stickBase}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div 
        style={{
          ...styles.stickKnob,
          transform: `translate(${activeInfo ? activeInfo.x : 0}px, ${activeInfo ? activeInfo.y : 0}px)`
        }}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: '#E7DFC6',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    touchAction: 'none',
    fontFamily: 'sans-serif',
    color: '#3A2E24',
    userSelect: 'none',
  },
  loading: {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#7F5539',
    fontSize: '24px',
    zIndex: 100,
    fontWeight: 'bold',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 32px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerIcon: {
    padding: '8px',
    borderRadius: '12px',
    backgroundColor: '#F4EFD8',
    boxShadow: '0 4px 12px rgba(58, 46, 36, 0.08)',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 600,
    letterSpacing: '-0.02em',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  headerBtn: {
    padding: '10px 20px',
    backgroundColor: '#B08968',
    color: '#F4EFD8',
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
  },
  main: {
    flex: '1 1 0%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 48px',
    position: 'relative',
  },
  shoulderL: {
    position: 'absolute',
    top: '16px',
    left: '48px',
    width: '128px',
    height: '48px',
    backgroundColor: '#F4EFD8',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(176, 137, 104, 0.1)',
  },
  shoulderR: {
    position: 'absolute',
    top: '16px',
    right: '48px',
    width: '128px',
    height: '48px',
    backgroundColor: '#F4EFD8',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(176, 137, 104, 0.1)',
  },
  shoulderText: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#7F5539',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  leftPanel: {
    width: '256px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPanel: {
    position: 'relative',
    flex: '1 1 0%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenWrapper: {
    position: 'relative',
    width: '600px',
    aspectRatio: '3/2',
    backgroundColor: '#000',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 35px 60px -15px rgba(58, 46, 36, 0.3)',
    border: '8px solid #F4EFD8',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenInner: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  canvas: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    imageRendering: 'pixelated' as any,
  },
  screenGlare: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    pointerEvents: 'none',
    background: 'linear-gradient(to top right, rgba(255,255,255,0.05), transparent)',
  },
  startSelectWrapper: {
    position: 'absolute',
    bottom: '-40px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '48px',
  },
  bottomPillContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  pillBtn: {
    width: '64px',
    height: '24px',
    backgroundColor: '#F4EFD8',
    borderRadius: '9999px',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(176, 137, 104, 0.2)',
  },
  pillLabel: {
    marginTop: '8px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#7F5539',
  },
  rightPanel: {
    width: '256px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  abWrapper: {
    position: 'relative',
    width: '192px',
    height: '192px',
  },
  bBtn: {
    position: 'absolute',
    left: 0,
    bottom: '16px',
    width: '80px',
    height: '80px',
    backgroundColor: 'rgba(244, 239, 216, 0.6)',
    backdropFilter: 'blur(4px)',
    borderRadius: '9999px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    border: '2px solid #B08968',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aBtn: {
    position: 'absolute',
    right: 0,
    top: '16px',
    width: '96px',
    height: '96px',
    backgroundColor: '#B08968',
    borderRadius: '9999px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  abText: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#7F5539',
  },
  abTextAlt: {
    fontSize: '30px',
    fontWeight: 700,
    color: '#F4EFD8',
  },
  stickBase: {
    position: 'relative',
    width: '192px',
    height: '192px',
  },
  stickOuterRing: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#F4EFD8',
    borderRadius: '9999px',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    border: '2px solid rgba(176, 137, 104, 0.2)',
  },
  stickInnerTrack: {
    position: 'absolute',
    top: '16px', left: '16px', right: '16px', bottom: '16px',
    backgroundColor: '#E7DFC6',
    borderRadius: '9999px',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  },
  stickKnob: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '112px',
    height: '112px',
    backgroundColor: '#B08968',
    borderRadius: '9999px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '4px solid #F4EFD8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickKnobInner: {
    width: '48px',
    height: '48px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(127, 85, 57, 0.2)',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  },
  footer: {
    padding: '32px 48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#F4EFD8',
    padding: '8px 16px',
    borderRadius: '16px',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '9999px',
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    opacity: 0.7,
    color: '#3A2E24',
  },
  footerVersion: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    opacity: 0.4,
    color: '#3A2E24',
  }
};
