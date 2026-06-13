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
      <div style={styles.screenWrapper}>
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>

      {loading && <div style={styles.loading}>Loading...</div>}

      {!loading && (
        <div style={styles.controlsOverlay}>
          
          {/* Top Left: L */}
          <div style={styles.topLeft}>
            <div 
              style={styles.shoulderBtn}
              onTouchStart={() => btnPress('l')}
              onTouchEnd={() => btnRelease('l')}
            >
              <span style={styles.outlinedText}>L</span>
            </div>
          </div>

          {/* Top Right: R */}
          <div style={styles.topRight}>
            <div 
              style={styles.shoulderBtn}
              onTouchStart={() => btnPress('r')}
              onTouchEnd={() => btnRelease('r')}
            >
              <span style={styles.outlinedText}>R</span>
            </div>
          </div>

          {/* Bottom Left: Thumbstick */}
          <div style={styles.bottomLeft}>
            <Thumbstick onMove={handleStickMove} onRelease={handleStickRelease} />
          </div>

          {/* Bottom Center: Select, Start, Back */}
          <div style={styles.bottomCenter}>
            <div style={styles.pillContainer}>
              <button 
                style={styles.roundSmallBtn}
                onClick={onExit}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <span style={styles.outlinedTextSmall}>BACK</span>
            </div>
            
            <div style={styles.pillContainer}>
              <div 
                style={styles.pillBtn}
                onTouchStart={() => btnPress('select')}
                onTouchEnd={() => btnRelease('select')}
              ></div>
              <span style={styles.outlinedTextSmall}>SELECT</span>
            </div>

            <div style={styles.pillContainer}>
              <div 
                style={styles.pillBtn}
                onTouchStart={() => btnPress('start')}
                onTouchEnd={() => btnRelease('start')}
              ></div>
              <span style={styles.outlinedTextSmall}>START</span>
            </div>
          </div>

          {/* Bottom Right: A/B */}
          <div style={styles.bottomRight}>
            <div style={styles.abWrapper}>
              <div 
                style={styles.bBtn}
                onTouchStart={() => btnPress('b')}
                onTouchEnd={() => btnRelease('b')}
              >
                <span style={styles.outlinedTextLarge}>B</span>
              </div>
              <div 
                style={styles.aBtn}
                onTouchStart={() => btnPress('a')}
                onTouchEnd={() => btnRelease('a')}
              >
                <span style={styles.outlinedTextLarge}>A</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function Thumbstick({ onMove, onRelease }: { onMove: (x: number, y: number) => void, onRelease: () => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [activeInfo, setActiveInfo] = useState<{id: number, x: number, y: number} | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeInfo) return;
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
      <div style={styles.stickOuterRing}></div>
      <div style={styles.stickInnerTrack}></div>
      <div 
        style={{
          ...styles.stickKnob,
          transform: `translate(calc(-50% + ${activeInfo ? activeInfo.x : 0}px), calc(-50% + ${activeInfo ? activeInfo.y : 0}px))`
        }}
      >
        <div style={styles.stickKnobInner}></div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: '#000', // Black background for fullscreen game
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    touchAction: 'none',
    fontFamily: 'sans-serif',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  loading: {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#E7DFC6',
    fontSize: '24px',
    zIndex: 100,
    fontWeight: 'bold',
  },
  screenWrapper: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    imageRendering: 'pixelated' as any,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0, left: 0, width: '100%', height: '100%',
    pointerEvents: 'none', // Let canvas clicks through where empty
  },
  topLeft: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    pointerEvents: 'auto',
  },
  topRight: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    pointerEvents: 'auto',
  },
  bottomLeft: {
    position: 'absolute',
    bottom: '16px',
    left: '16px',
    pointerEvents: 'auto',
  },
  bottomCenter: {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-end',
    pointerEvents: 'auto',
  },
  bottomRight: {
    position: 'absolute',
    bottom: '16px',
    right: '16px',
    pointerEvents: 'auto',
  },
  shoulderBtn: {
    width: '80px',
    height: '32px',
    backgroundColor: 'transparent',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.4)',
  },
  abWrapper: {
    position: 'relative',
    width: '120px',
    height: '120px',
  },
  bBtn: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '56px',
    height: '56px',
    backgroundColor: 'transparent',
    borderRadius: '28px',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '56px',
    height: '56px',
    backgroundColor: 'transparent',
    borderRadius: '28px',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  pillBtn: {
    width: '48px',
    height: '16px',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.4)',
  },
  roundSmallBtn: {
    width: '24px',
    height: '24px',
    backgroundColor: 'transparent',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  outlinedText: {
    color: 'transparent',
    WebkitTextStroke: '1px rgba(255, 255, 255, 0.4)',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  outlinedTextSmall: {
    color: 'transparent',
    WebkitTextStroke: '0.5px rgba(255, 255, 255, 0.4)',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  outlinedTextLarge: {
    color: 'transparent',
    WebkitTextStroke: '1px rgba(255, 255, 255, 0.4)',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  stickBase: {
    position: 'relative',
    width: '120px',
    height: '120px',
  },
  stickOuterRing: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'transparent',
    borderRadius: '60px',
    border: '1px solid rgba(255, 255, 255, 0.4)',
  },
  stickInnerTrack: {
    display: 'none',
  },
  stickKnob: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '40px',
    height: '40px',
    backgroundColor: 'transparent',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickKnobInner: {
    width: '8px',
    height: '8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
};
