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
        canvasRef.current.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          window.location.reload();
        });
        
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

  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimeoutRef = useRef<number | null>(null);

  const resetHideTimer = () => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 2500);
  };

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  const handlePointerDown = () => resetHideTimer();
  const handlePointerMove = () => resetHideTimer();

  return (
    <div className="emulator-container">
      <style>{`
        .emulator-container {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }
        .game-screen-area {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .controls-area {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none;
        }
        .hideable-controls {
          transition: opacity 0.5s ease;
        }
        
        .ctrl-top-left { position: absolute; top: 16px; left: 16px; pointer-events: auto; }
        .ctrl-top-right { position: absolute; top: 16px; right: 16px; pointer-events: auto; }
        .ctrl-bottom-left { position: absolute; bottom: 32px; left: 32px; pointer-events: auto; }
        .ctrl-bottom-center { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); display: flex; gap: 24px; align-items: flex-end; pointer-events: auto; }
        .ctrl-bottom-right { position: absolute; bottom: 32px; right: 96px; pointer-events: auto; }

        @media (orientation: portrait) {
          .game-screen-area {
            height: auto;
            flex: none;
            width: 100vw;
            aspect-ratio: 3/2;
            margin-top: env(safe-area-inset-top, 0px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 10;
          }
          .controls-area {
            position: relative;
            flex: 1;
            width: 100%;
          }
          .ctrl-top-left { top: 16px; left: 16px; }
          .ctrl-top-right { top: 16px; right: 16px; }
          .ctrl-bottom-left { bottom: 80px; left: 32px; opacity: 1 !important; }
          .ctrl-bottom-right { bottom: 80px; right: 40px; opacity: 1 !important; }
          .ctrl-bottom-center { bottom: unset; top: 32px; gap: 40px; }
        }
      `}</style>
      
      <div className="game-screen-area">
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>

      {loading && <div style={styles.loading}>Loading...</div>}

      {!loading && (
        <div className="controls-area">
          
          {/* Top Left: Back & L */}
          <div className="ctrl-top-left hideable-controls" style={{ opacity: controlsVisible ? 1 : 0, display: 'flex', gap: '24px', alignItems: 'center' }} onTouchStart={handlePointerDown} onTouchMove={handlePointerMove}>
            <div style={styles.pillContainer}>
              <button 
                style={styles.roundSmallBtn}
                onClick={onExit}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <span style={styles.outlinedTextSmall}>EXIT</span>
            </div>
            <div 
              style={styles.shoulderBtn}
              onTouchStart={() => btnPress('l')}
              onTouchEnd={() => btnRelease('l')}
            >
              <span style={styles.outlinedText}>L</span>
            </div>
          </div>

          {/* Top Right: R */}
          <div className="ctrl-top-right hideable-controls" style={{ opacity: controlsVisible ? 1 : 0 }} onTouchStart={handlePointerDown} onTouchMove={handlePointerMove}>
            <div 
              style={styles.shoulderBtn}
              onTouchStart={() => btnPress('r')}
              onTouchEnd={() => btnRelease('r')}
            >
              <span style={styles.outlinedText}>R</span>
            </div>
          </div>

          {/* Bottom Left: Thumbstick */}
          <div className="ctrl-bottom-left hideable-controls" style={{ opacity: controlsVisible ? 1 : 0 }} onTouchStart={handlePointerDown} onTouchMove={handlePointerMove}>
            <Thumbstick onMove={handleStickMove} onRelease={handleStickRelease} />
          </div>

          {/* Bottom Center: Select, Start */}
          <div className="ctrl-bottom-center hideable-controls" style={{ opacity: controlsVisible ? 1 : 0 }} onTouchStart={handlePointerDown} onTouchMove={handlePointerMove}>
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
          <div className="ctrl-bottom-right hideable-controls" style={{ opacity: controlsVisible ? 1 : 0 }} onTouchStart={handlePointerDown} onTouchMove={handlePointerMove}>
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
  loading: {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#E7DFC6',
    fontSize: '24px',
    zIndex: 100,
    fontWeight: 'bold',
  },
  canvas: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    imageRendering: 'pixelated' as any,
  },
  shoulderBtn: {
    width: '80px',
    height: '32px',
    backgroundColor: 'transparent',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
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
    border: 'none',
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
    border: 'none',
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
    border: 'none',
  },
  roundSmallBtn: {
    width: '24px',
    height: '24px',
    backgroundColor: 'transparent',
    borderRadius: '12px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  outlinedText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  outlinedTextSmall: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  outlinedTextLarge: {
    color: 'rgba(255, 255, 255, 0.5)',
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
