import { listen } from '@tauri-apps/api/event';
import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

import particleAnimation from '~/assets/particle.json';

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
    <div className="pointer-events-none fixed inset-x-0 top-[2px] z-50 scale-150">
      <Lottie
        key={key}
        animationData={particleAnimation}
        loop={false}
        autoplay
        onComplete={() => setVisible(false)}
        rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
        className="w-full"
      />
    </div>
  );
}
