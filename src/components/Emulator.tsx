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
          height: 100dvh;
          width: 100dvw;
        }
        .game-screen-area {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .controls-area {
          position: absolute;
          z-index: 2;
          top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none;
        }
        .hideable-controls {
          transition: opacity 0.5s ease;
        }
        
        .ab-wrapper {
          position: relative;
          width: 160px;
          height: 160px;
        }
        .b-btn-touch, .a-btn-touch {
          position: absolute;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
        }
        .b-btn-touch { left: 0; bottom: 0; }
        .a-btn-touch { right: 0; top: 0; }
        
        .btn-visual-round {
          width: 56px;
          height: 56px;
          border-radius: 28px;
          border: 1px solid rgba(150, 150, 150, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-visual-shoulder {
          width: 80px;
          height: 32px;
          border-radius: 16px;
          border: 1px solid rgba(150, 150, 150, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shoulder-touch {
          padding: 16px;
          margin: -16px;
          pointer-events: auto;
        }

        .ctrl-top-left { position: absolute; top: 16px; left: 16px; pointer-events: auto; }
        .ctrl-top-right { position: absolute; top: 16px; right: 16px; pointer-events: auto; }
        .ctrl-bottom-left { position: absolute; bottom: 32px; left: 32px; pointer-events: auto; }
        .ctrl-bottom-startselect { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); display: flex; gap: 40px; align-items: flex-end; pointer-events: auto; }
        .ctrl-bottom-exit { position: absolute; top: 16px; left: 50%; transform: translateX(-50%); display: flex; align-items: flex-end; pointer-events: auto; }
        .ctrl-bottom-right { position: absolute; bottom: 32px; right: 96px; pointer-events: auto; }

        @media (orientation: portrait) {
          .game-screen-area {
            flex: none;
            width: 100%;
            height: 66vw;
            margin-top: env(safe-area-inset-top, 0px);
            background-color: #000;
          }
          .controls-area {
            position: relative;
            flex: 1;
            width: 100%;
            background-color: #000;
          }
          .ctrl-top-left { top: 16px; left: 16px; }
          .ctrl-top-right { top: 16px; right: 16px; }
          .ctrl-bottom-left { bottom: 80px; left: 32px; opacity: 1 !important; }
          .ctrl-bottom-right { bottom: 80px; right: 24px; opacity: 1 !important; }
          .ctrl-bottom-startselect { bottom: 80px; gap: 48px; }
          .ctrl-bottom-exit { bottom: 24px; top: unset; }
          
          .ab-wrapper {
            width: 180px;
            height: 180px;
          }
          .a-btn-touch { right: -16px; top: -16px; }
        }
      `}</style>
      
      <div className="game-screen-area">
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>

      {loading && <div style={styles.loading}>Loading...</div>}

      {!loading && (
        <div className="controls-area">
          
          {/* Top Left: L */}
          <div className="ctrl-top-left hideable-controls" style={{ opacity: controlsVisible ? 1 : 0 }} onTouchStart={handlePointerDown} onTouchMove={handlePointerMove}>
            <div 
              className="shoulder-touch"
              onTouchStart={() => btnPress('l')}
              onTouchEnd={() => btnRelease('l')}
            >
              <div style={styles.shoulderBtn} className="btn-visual-shoulder">
                <span style={styles.outlinedText}>L</span>
              </div>
            </div>
          </div>

          {/* Top Right: R */}
          <div className="ctrl-top-right hideable-controls" style={{ opacity: controlsVisible ? 1 : 0 }} onTouchStart={handlePointerDown} onTouchMove={handlePointerMove}>
            <div 
              className="shoulder-touch"
              onTouchStart={() => btnPress('r')}
              onTouchEnd={() => btnRelease('r')}
            >
              <div style={styles.shoulderBtn} className="btn-visual-shoulder">
                <span style={styles.outlinedText}>R</span>
              </div>
            </div>
          </div>

          {/* Bottom Left: Thumbstick */}
          <div className="ctrl-bottom-left" onTouchStart={handlePointerDown} onTouchMove={handlePointerMove}>
            <Thumbstick onMove={handleStickMove} onRelease={handleStickRelease} />
          </div>

          {/* Bottom Center: Select, Start */}
          <div className="ctrl-bottom-startselect hideable-controls" style={{ opacity: controlsVisible ? 1 : 0 }} onTouchStart={handlePointerDown} onTouchMove={handlePointerMove}>
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

          <div className="ctrl-bottom-exit hideable-controls" style={{ opacity: controlsVisible ? 1 : 0 }} onTouchStart={handlePointerDown} onTouchMove={handlePointerMove}>
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
          </div>

          {/* Bottom Right: A/B */}
          <div className="ctrl-bottom-right" onTouchStart={handlePointerDown} onTouchMove={handlePointerMove}>
            <div className="ab-wrapper">
              <div 
                className="b-btn-touch"
                onTouchStart={() => btnPress('b')}
                onTouchEnd={() => btnRelease('b')}
              >
                <div style={styles.bBtn} className="btn-visual-round">
                  <span style={styles.outlinedTextLarge}>B</span>
                </div>
              </div>
              <div 
                className="a-btn-touch"
                onTouchStart={() => btnPress('a')}
                onTouchEnd={() => btnRelease('a')}
              >
                <div style={styles.aBtn} className="btn-visual-round">
                  <span style={styles.outlinedTextLarge}>A</span>
                </div>
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
  const knobRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    activeIdRef.current = touch.identifier;
    updatePosition(touch);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeIdRef.current === null) return;
    const touch = Array.from(e.changedTouches).find((t: React.Touch) => t.identifier === activeIdRef.current);
    if (touch) updatePosition(touch);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (activeIdRef.current === null) return;
    const touch = Array.from(e.changedTouches).find((t: React.Touch) => t.identifier === activeIdRef.current);
    if (touch) {
      activeIdRef.current = null;
      if (knobRef.current) {
        knobRef.current.style.transform = `translate(-50%, -50%)`;
      }
      onRelease();
    }
  };

  const updatePosition = (touch: React.Touch) => {
    if (!baseRef.current || !knobRef.current) return;
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
    
    knobRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    
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
        ref={knobRef}
        style={{
          ...styles.stickKnob,
          transform: `translate(-50%, -50%)`
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
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  abWrapper: {
    position: 'relative',
    width: '120px',
    height: '120px',
  },
  bBtn: {
    backgroundColor: 'transparent',
  },
  aBtn: {
    backgroundColor: 'transparent',
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
    border: '1px solid rgba(150, 150, 150, 0.4)',
  },
  roundSmallBtn: {
    width: '24px',
    height: '24px',
    backgroundColor: 'transparent',
    borderRadius: '12px',
    border: '1px solid rgba(150, 150, 150, 0.4)',
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
    border: '1px solid rgba(150, 150, 150, 0.4)',
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
    border: '1px solid rgba(150, 150, 150, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickKnobInner: {
    width: '8px',
    height: '8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
};
