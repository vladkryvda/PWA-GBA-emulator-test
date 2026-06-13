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
          
          {/* Top Left: Back button & L */}
          <div style={styles.topLeft}>
            <button 
              style={styles.backBtn}
              onClick={onExit}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div 
              style={styles.shoulderBtn}
              onTouchStart={() => btnPress('l')}
              onTouchEnd={() => btnRelease('l')}
            >L</div>
          </div>

          {/* Top Right: R */}
          <div style={styles.topRight}>
            <div 
              style={styles.shoulderBtn}
              onTouchStart={() => btnPress('r')}
              onTouchEnd={() => btnRelease('r')}
            >R</div>
          </div>

          {/* Bottom Left: Thumbstick & Select */}
          <div style={styles.bottomLeft}>
            <Thumbstick onMove={handleStickMove} onRelease={handleStickRelease} />
            <div style={styles.selectBtnContainer}>
              <div 
                style={styles.pillBtn}
                onTouchStart={() => btnPress('select')}
                onTouchEnd={() => btnRelease('select')}
              ></div>
              <span style={styles.pillLabel}>Select</span>
            </div>
          </div>

          {/* Bottom Right: A/B & Start */}
          <div style={styles.bottomRight}>
            <div style={styles.abWrapper}>
              <div 
                style={styles.bBtn}
                onTouchStart={() => btnPress('b')}
                onTouchEnd={() => btnRelease('b')}
              >B</div>
              <div 
                style={styles.aBtn}
                onTouchStart={() => btnPress('a')}
                onTouchEnd={() => btnRelease('a')}
              >A</div>
            </div>
            <div style={styles.startBtnContainer}>
              <div 
                style={styles.pillBtn}
                onTouchStart={() => btnPress('start')}
                onTouchEnd={() => btnRelease('start')}
              ></div>
              <span style={styles.pillLabel}>Start</span>
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
    top: '24px',
    left: '24px',
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
    pointerEvents: 'auto',
  },
  topRight: {
    position: 'absolute',
    top: '24px',
    right: '24px',
    pointerEvents: 'auto',
  },
  bottomLeft: {
    position: 'absolute',
    bottom: '48px',
    left: '48px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '48px',
    pointerEvents: 'auto',
  },
  bottomRight: {
    position: 'absolute',
    bottom: '48px',
    right: '48px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '48px',
    pointerEvents: 'auto',
  },
  backBtn: {
    width: '48px',
    height: '48px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(244, 239, 216, 0.4)',
    color: '#F4EFD8',
    backdropFilter: 'blur(4px)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  },
  shoulderBtn: {
    width: '100px',
    height: '40px',
    backgroundColor: 'rgba(244, 239, 216, 0.3)',
    borderRadius: '9999px',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#F4EFD8',
    fontWeight: 700,
    fontSize: '16px',
    border: '1px solid rgba(244, 239, 216, 0.2)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  },
  abWrapper: {
    position: 'relative',
    width: '160px',
    height: '160px',
  },
  bBtn: {
    position: 'absolute',
    left: 0,
    bottom: '16px',
    width: '72px',
    height: '72px',
    backgroundColor: 'rgba(244, 239, 216, 0.4)',
    backdropFilter: 'blur(4px)',
    borderRadius: '9999px',
    border: '2px solid rgba(244, 239, 216, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#F4EFD8',
    fontWeight: 700,
    fontSize: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  },
  aBtn: {
    position: 'absolute',
    right: 0,
    top: '16px',
    width: '84px',
    height: '84px',
    backgroundColor: 'rgba(244, 239, 216, 0.6)',
    backdropFilter: 'blur(4px)',
    borderRadius: '9999px',
    border: '2px solid #F4EFD8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#F4EFD8',
    fontWeight: 700,
    fontSize: '28px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  },
  startBtnContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  selectBtnContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  pillBtn: {
    width: '64px',
    height: '24px',
    backgroundColor: 'rgba(244, 239, 216, 0.4)',
    backdropFilter: 'blur(4px)',
    borderRadius: '9999px',
    border: '1px solid rgba(244, 239, 216, 0.4)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  pillLabel: {
    marginTop: '8px',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'rgba(244, 239, 216, 0.8)',
  },
  stickBase: {
    position: 'relative',
    width: '160px',
    height: '160px',
  },
  stickOuterRing: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(244, 239, 216, 0.1)',
    borderRadius: '9999px',
    border: '2px solid rgba(244, 239, 216, 0.2)',
  },
  stickInnerTrack: {
    position: 'absolute',
    top: '16px', left: '16px', right: '16px', bottom: '16px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '9999px',
  },
  stickKnob: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '96px',
    height: '96px',
    backgroundColor: 'rgba(244, 239, 216, 0.6)',
    backdropFilter: 'blur(4px)',
    borderRadius: '9999px',
    border: '3px solid #F4EFD8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  stickKnobInner: {
    width: '40px',
    height: '40px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
};
