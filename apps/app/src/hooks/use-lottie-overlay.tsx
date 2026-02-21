import { listen } from '@tauri-apps/api/event';
import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

import confettiAnimation from '~/assets/confetti.json';

export function useLottieOverlay() {
  const [key, setKey] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cleanup = listen('menubar_panel_did_open', () => {
      setKey((prev) => prev + 1);
      setVisible(true);
    });
    return () => {
      void cleanup.then((fn) => fn());
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <Lottie
        key={key}
        animationData={confettiAnimation}
        loop={false}
        autoplay
        onComplete={() => setVisible(false)}
        rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
        className="size-full"
      />
    </div>
  );
}
