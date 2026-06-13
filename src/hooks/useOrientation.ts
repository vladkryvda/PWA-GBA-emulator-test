import { useState, useEffect } from 'react';

export function useOrientation() {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Use screen.orientation API if available
      if (window.screen && window.screen.orientation) {
        const type = window.screen.orientation.type;
        setIsPortrait(type.startsWith('portrait'));
      } else {
        // Fallback to matchMedia
        setIsPortrait(window.innerHeight > window.innerWidth);
      }
    };

    checkOrientation();

    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', checkOrientation);
    } else {
      window.addEventListener('resize', checkOrientation);
    }

    return () => {
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', checkOrientation);
      } else {
        window.removeEventListener('resize', checkOrientation);
      }
    };
  }, []);

  return { isPortrait };
}
