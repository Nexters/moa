import Lottie from 'lottie-react';
import { useState } from 'react';

import confettiAnimation from '~/assets/confetti.json';

export function useLottieOverlay() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <Lottie
        animationData={confettiAnimation}
        loop={false}
        autoplay
        onComplete={() => setVisible(false)}
        className="size-full"
      />
    </div>
  );
}
