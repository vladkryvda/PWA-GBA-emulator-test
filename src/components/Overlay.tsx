import React from 'react';

export function Overlay() {
  return (
    <div style={styles.overlay}>
      <div style={styles.icon}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <path d="M12 18h.01" />
          <path d="M16.5 15.5l-9-9" />
          <path d="M7.5 15.5l9-9" />
        </svg>
      </div>
      <h2 style={styles.text}>Rotate your device</h2>
      <p style={styles.subtext}>Gameplay is only available in landscape mode.</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'var(--bg-overlay)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'var(--text-primary)',
    textAlign: 'center',
    padding: '24px',
  },
  icon: {
    marginBottom: '24px',
    animation: 'rotatePhone 2s ease-in-out infinite',
  },
  text: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  subtext: {
    fontSize: '16px',
    color: 'var(--text-secondary)',
  }
};

// Inject animation
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
@keyframes rotatePhone {
  0% { transform: rotate(0deg); }
  30% { transform: rotate(-90deg); }
  70% { transform: rotate(-90deg); }
  100% { transform: rotate(0deg); }
}
`;
document.head.appendChild(styleSheet);
