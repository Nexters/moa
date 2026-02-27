import { getCurrentWindow } from '@tauri-apps/api/window';
import confetti from 'canvas-confetti';

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

const end = Date.now() + DURATION_MS;

function frame() {
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
    setTimeout(() => {
      void getCurrentWindow().close();
    }, 1500);
  }
}

requestAnimationFrame(frame);
