import { getCurrentWindow } from '@tauri-apps/api/window';
import confetti from 'canvas-confetti';

const COLORS = ['#0a4b30', '#0f7449', '#17a968', '#1fd683', '#6de9b1'];

const defaults: confetti.Options = {
  colors: COLORS,
  ticks: 300,
  gravity: 4,
  decay: 0.95,
  startVelocity: 60,
  scalar: 1.5,
  particleCount: 200,
};

void Promise.all([
  // 좌측
  confetti({
    ...defaults,
    angle: 60,
    spread: 90,
    origin: { x: 0, y: 0.8 },
  }),
  confetti({
    ...defaults,
    angle: 60,
    spread: 80,
    origin: { x: 0, y: 0.9 },
  }),
  // 우측
  confetti({
    ...defaults,
    angle: 120,
    spread: 90,
    origin: { x: 1, y: 0.8 },
  }),
  confetti({
    ...defaults,
    angle: 120,
    spread: 80,
    origin: { x: 1, y: 0.9 },
  }),
]).then(() => {
  void getCurrentWindow().destroy();
});
