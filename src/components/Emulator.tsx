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
    const threshold = 0.3;
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
    <div className="emulator-container">
      <style>{`
        /* Force app root background */
        body { background-color: #000; overflow: hidden; }
        
        .emulator-container {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          z-index: 9999;
        }

        .game-screen-area {
          position: relative;
          z-index: 1;
          width: 100%;
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #000;
        }

        .controls-area {
          position: absolute;
          z-index: 2;
          top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
        }

        @media (orientation: portrait) {
          .game-screen-area {
            flex: none;
            width: 100%;
            height: auto;
            aspect-ratio: 3/2;
            margin-top: env(safe-area-inset-top, 0px);
          }
          .controls-area {
            position: relative;
            flex: 1;
            width: 100%;
            background-color: #000;
          }
        }

        /* Touch Interaction & Animation */
        .touch-area { pointer-events: auto; }
        .anim-press { transition: transform 0.1s ease, background-color 0.1s ease; }
        .touch-area:active .anim-press { 
          transform: scale(0.85); 
          background-color: rgba(255, 255, 255, 0.1); 
        }

        /* Hierarchy Colors */
        .primary-btn { border: 1px solid rgba(255, 255, 255, 0.5); }
        .primary-btn span { color: rgba(255, 255, 255, 0.6); }

        /* Secondary buttons are significantly greyer */
        .secondary-btn { border: 1px solid rgba(255, 255, 255, 0.15); }
        .secondary-btn span { color: rgba(255, 255, 255, 0.25); }
        .secondary-btn svg { stroke: rgba(255, 255, 255, 0.25); }

        /* Shapes */
        .btn-shoulder { width: 80px; height: 32px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
        .btn-shoulder span { font-size: 14px; font-weight: bold; }
        .touch-area-shoulder { padding: 16px; margin: -16px; }

        .btn-round-large { width: 56px; height: 56px; border-radius: 28px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; }
        .touch-area-round { width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; position: absolute; }
        .b-btn-pos { left: 0; bottom: 0; }
        .a-btn-pos { right: 0; top: 0; }

        .btn-pill { width: 64px; height: 26px; border-radius: 13px; display: flex; align-items: center; justify-content: center; }
        .btn-pill span { font-size: 9px; font-weight: bold; letter-spacing: 0.5px; }

        .btn-round-small { width: 34px; height: 34px; border-radius: 17px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        /* Positions */
        .ctrl-top-left { position: absolute; top: 16px; left: 16px; }
        .ctrl-top-right { position: absolute; top: 16px; right: 16px; }
        
        .ctrl-bottom {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 24px;
          align-items: center;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .ctrl-bottom-left { position: absolute; bottom: 80px; left: 24px; pointer-events: auto; }
        .ctrl-bottom-right { position: absolute; bottom: 80px; right: 24px; }
        
        .ab-wrapper { position: relative; width: 140px; height: 140px; }

        @media (orientation: portrait) {
          .ab-wrapper { width: 160px; height: 160px; } /* More distance between A and B */
        }
        @media (orientation: landscape) {
          .ctrl-bottom-left { bottom: 48px; left: 48px; }
          .ctrl-bottom-right { bottom: 48px; right: 96px; }
        }
      `}</style>
      
      <div className="game-screen-area">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' as any }} />
      </div>

      {loading && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#E7DFC6', fontSize: '24px', zIndex: 100, fontWeight: 'bold' }}>Loading...</div>}

      {!loading && (
        <div className="controls-area">
          
          <div className="ctrl-top-left">
            <div 
              className="touch-area touch-area-shoulder"
              onTouchStart={() => btnPress('l')}
              onTouchEnd={() => btnRelease('l')}
              onTouchCancel={() => btnRelease('l')}
            >
              <div className="btn-shoulder secondary-btn anim-press">
                <span>L</span>
              </div>
            </div>
          </div>

          <div className="ctrl-top-right">
            <div 
              className="touch-area touch-area-shoulder"
              onTouchStart={() => btnPress('r')}
              onTouchEnd={() => btnRelease('r')}
              onTouchCancel={() => btnRelease('r')}
            >
              <div className="btn-shoulder secondary-btn anim-press">
                <span>R</span>
              </div>
            </div>
          </div>

          <div className="ctrl-bottom-left">
            <Thumbstick onMove={handleStickMove} onRelease={handleStickRelease} />
          </div>

          <div className="ctrl-bottom">
            <div 
              className="touch-area" 
              style={{ padding: '8px' }}
              onTouchStart={() => btnPress('select')} 
              onTouchEnd={() => btnRelease('select')} 
              onTouchCancel={() => btnRelease('select')}
            >
              <div className="btn-pill secondary-btn anim-press">
                <span>SELECT</span>
              </div>
            </div>

            <div 
              className="touch-area" 
              style={{ padding: '8px' }}
              onTouchStart={(e) => { e.preventDefault(); onExit(); }}
            >
              <div className="btn-round-small secondary-btn anim-press">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </div>
            </div>

            <div 
              className="touch-area" 
              style={{ padding: '8px' }}
              onTouchStart={() => btnPress('start')} 
              onTouchEnd={() => btnRelease('start')} 
              onTouchCancel={() => btnRelease('start')}
            >
              <div className="btn-pill secondary-btn anim-press">
                <span>START</span>
              </div>
            </div>
          </div>

          <div className="ctrl-bottom-right">
            <div className="ab-wrapper">
              <div 
                className="touch-area touch-area-round b-btn-pos"
                onTouchStart={() => btnPress('b')}
                onTouchEnd={() => btnRelease('b')}
                onTouchCancel={() => btnRelease('b')}
              >
                <div className="btn-round-large primary-btn anim-press">
                  <span>B</span>
                </div>
              </div>
              <div 
                className="touch-area touch-area-round a-btn-pos"
                onTouchStart={() => btnPress('a')}
                onTouchEnd={() => btnRelease('a')}
                onTouchCancel={() => btnRelease('a')}
              >
                <div className="btn-round-large primary-btn anim-press">
                  <span>A</span>
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
      style={{ position: 'relative', width: '120px', height: '120px' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '60px', border: '1px solid rgba(255, 255, 255, 0.5)' }}></div>
      <div 
        ref={knobRef}
        style={{
          position: 'absolute', top: '50%', left: '50%', width: '40px', height: '40px',
          borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `translate(-50%, -50%)`
        }}
      >
        <div style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.6)' }}></div>
      </div>
    </div>
  );
}
