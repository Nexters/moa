import { getCurrentWindow } from '@tauri-apps/api/window';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

const DURATION_MS = 3000;
const COLORS = [
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff',
  '#ff8800',
  '#ff0088',
];

export function ConfettiOverlay() {
  useEffect(() => {
    const end = Date.now() + DURATION_MS;

    const frame = () => {
      void confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.5 },
        colors: COLORS,
      });
      void confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.5 },
        colors: COLORS,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      } else {
        // 파티클이 떨어진 후 잠시 대기 후 창 닫기
        setTimeout(() => {
          void getCurrentWindow().close();
        }, 1500);
      }
    };

    requestAnimationFrame(frame);
  }, []);

  return <div className="fixed inset-0" />;
}
