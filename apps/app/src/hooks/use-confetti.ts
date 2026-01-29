import { useEffect } from 'react';

const rootSelector = '#root';
const confettiFrequency = 40;

const confettiColors = ['#0a4b30', '#0f7449', '#17a968', '#1fd683', '#6de9b1'];

type ConfettiAnimation = {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
};

const confettiAnimations: Record<string, ConfettiAnimation> = {
  slow: {
    keyframes: [
      { transform: 'translate3d(0, 0, 0) rotateX(0) rotateY(0)' },
      {
        transform:
          'translate3d(25px, 105vh, 0) rotateX(360deg) rotateY(180deg)',
      },
    ],
    options: { duration: 2250, fill: 'forwards' },
  },
  medium: {
    keyframes: [
      { transform: 'translate3d(0, 0, 0) rotateX(0) rotateY(0)' },
      {
        transform:
          'translate3d(100px, 105vh, 0) rotateX(100deg) rotateY(360deg)',
      },
    ],
    options: { duration: 1750, fill: 'forwards' },
  },
  fast: {
    keyframes: [
      { transform: 'translate3d(0, 0, 0) rotateX(0) rotateY(0)' },
      {
        transform:
          'translate3d(-50px, 105vh, 0) rotateX(10deg) rotateY(250deg)',
      },
    ],
    options: { duration: 1250, fill: 'forwards' },
  },
};

const animationTypes = Object.keys(confettiAnimations);

function getRandomItem<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function startConfetti() {
  const el = document.createElement('div');
  el.style.position = 'fixed';
  el.style.pointerEvents = 'none';
  el.style.width = '100dvw';
  el.style.height = '100dvh';

  const containerEl = document.createElement('div');
  containerEl.style.position = 'absolute';
  containerEl.style.overflow = 'hidden';
  containerEl.style.top = '0';
  containerEl.style.right = '0';
  containerEl.style.bottom = '0';
  containerEl.style.left = '0';
  el.appendChild(containerEl);

  const confettiInterval = setInterval(() => {
    const confettiEl = document.createElement('div');
    confettiEl.style.position = 'absolute';
    confettiEl.style.zIndex = '1';
    confettiEl.style.top = '-10px';
    confettiEl.style.borderRadius = '0%';

    const confettiSize = Math.floor(Math.random() * 3) + 7 + 'px';
    const confettiLeft = Math.floor(Math.random() * el.offsetWidth) + 'px';
    const confettiBackground = getRandomItem(confettiColors);
    const animationType = getRandomItem(animationTypes);

    confettiEl.style.left = confettiLeft;
    confettiEl.style.width = confettiSize;
    confettiEl.style.height = confettiSize;
    confettiEl.style.backgroundColor = confettiBackground;

    const { keyframes, options } = confettiAnimations[animationType];
    confettiEl.animate(keyframes, options);

    setTimeout(() => {
      confettiEl.parentNode?.removeChild(confettiEl);
    }, 3000);

    containerEl.appendChild(confettiEl);
  }, 1000 / confettiFrequency);

  const rootEl = document.querySelector(rootSelector);

  if (rootEl) {
    rootEl.prepend(el);
  } else {
    console.error(
      `[confetti] Root element with selector ${rootSelector} not found`,
    );
  }

  return () => {
    clearInterval(confettiInterval);
    setTimeout(() => {
      el.remove();
    }, 3000);
  };
}

export type UseConfettiOptions = {
  enabled?: boolean;
};

export function useConfetti({ enabled = true }: UseConfettiOptions = {}) {
  useEffect(() => {
    if (!enabled) return;

    return startConfetti();
  }, [enabled]);
}
