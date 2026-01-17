# Task 8: 월급날 축하 기능 (P1)

## 목표

월급날에 Confetti 효과와 함께 축하 화면을 표시하여 사용자에게 성취감을 제공한다.

## 스펙 참조

- [MVP 스펙](../mvp-spec.md)

## 기능 요구사항

| 항목           | 설명                                                      |
| -------------- | --------------------------------------------------------- |
| Confetti 효과  | 월급날 팝업 열 때 Raycast 스타일의 축하 파티클 애니메이션 |
| 축하 화면      | 이번 달 총 번 금액과 축하 메시지 표시                     |
| 표시 시점      | 월급날 근무시간(09:00~18:00) 동안 팝업 열면 자동 표시     |
| 휴일 대응      | 월급날이 주말/공휴일이면 이전 평일에 표시                 |
| 1회성 표시     | 해당 월급날에 한 번만 표시 (닫으면 다시 안 보임)          |

## 구현 내용

### 1. 실제 월급 지급일 계산 (`src/lib/payday-utils.ts`)

```typescript
/** 공휴일 목록 타입 */
type Holidays = string[]; // "2024-01-01" 형식

/** 주말 여부 확인 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 일요일 또는 토요일
}

/** 공휴일 여부 확인 */
function isHoliday(date: Date, holidays: Holidays): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return holidays.includes(dateStr);
}

/** 이전 평일 찾기 */
function getPreviousWorkday(date: Date, holidays: Holidays): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - 1);

  while (isWeekend(result) || isHoliday(result, holidays)) {
    result.setDate(result.getDate() - 1);
  }

  return result;
}

/** 실제 월급 지급일 계산 */
export function getActualPayday(
  year: number,
  month: number,
  payDay: number,
  holidays: Holidays,
): Date {
  // 해당 월의 월급날
  let payday = new Date(year, month, payDay);

  // 해당 월의 마지막 날보다 크면 마지막 날로 조정
  const lastDay = new Date(year, month + 1, 0).getDate();
  if (payDay > lastDay) {
    payday = new Date(year, month, lastDay);
  }

  // 주말이나 공휴일이면 이전 평일로 이동
  while (isWeekend(payday) || isHoliday(payday, holidays)) {
    payday = getPreviousWorkday(payday, holidays);
  }

  return payday;
}

/** 오늘이 월급날인지 확인 */
export function isPayday(payDay: number, holidays: Holidays): boolean {
  const now = new Date();
  const actualPayday = getActualPayday(
    now.getFullYear(),
    now.getMonth(),
    payDay,
    holidays,
  );

  return (
    now.getFullYear() === actualPayday.getFullYear() &&
    now.getMonth() === actualPayday.getMonth() &&
    now.getDate() === actualPayday.getDate()
  );
}

/** 현재 근무시간인지 확인 */
export function isWorkingHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 9 && hour < 18;
}
```

### 2. 공휴일 API 연동 (`src/hooks/use-holidays.ts`)

```typescript
import { useQuery } from '@tanstack/react-query';

interface HolidaysResponse {
  holidays: string[];
}

async function fetchHolidays(year: number, month: number): Promise<string[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/holidays?year=${year}&month=${month}`,
  );

  if (!response.ok) {
    throw new Error('공휴일 정보를 불러오는데 실패했습니다');
  }

  const data: HolidaysResponse = await response.json();
  return data.holidays;
}

export function useHolidays() {
  const now = new Date();

  return useQuery({
    queryKey: ['holidays', now.getFullYear(), now.getMonth()],
    queryFn: () => fetchHolidays(now.getFullYear(), now.getMonth()),
    staleTime: 1000 * 60 * 60 * 24, // 24시간 캐시
  });
}
```

### 3. 축하 상태 관리 (`src/stores/celebration-store.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CelebrationState {
  // 마지막으로 축하 화면을 본 월급날 (YYYY-MM-DD)
  lastCelebratedPayday: string | null;
  // 축하 화면 표시 여부
  showCelebration: boolean;
  // 축하 화면 닫기
  dismissCelebration: (paydayStr: string) => void;
  // 축하 화면 표시 가능 여부 확인
  canShowCelebration: (paydayStr: string) => boolean;
}

export const useCelebrationStore = create<CelebrationState>()(
  persist(
    (set, get) => ({
      lastCelebratedPayday: null,
      showCelebration: false,
      dismissCelebration: (paydayStr) =>
        set({
          showCelebration: false,
          lastCelebratedPayday: paydayStr,
        }),
      canShowCelebration: (paydayStr) => {
        const { lastCelebratedPayday } = get();
        return lastCelebratedPayday !== paydayStr;
      },
    }),
    {
      name: 'celebration-storage',
    },
  ),
);
```

### 4. Confetti 컴포넌트 (`src/features/celebration/confetti.tsx`)

```typescript
import { useEffect, useRef } from 'react';

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
}

export function Confetti({ isActive, duration = 3000 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Confetti 파티클 생성
    const particles: Particle[] = [];
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 3 + 2,
        speedX: Math.random() * 2 - 1,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 10 - 5,
      });
    }

    // 애니메이션
    let animationId: number;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
        ctx.restore();

        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [isActive, duration]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
}
```

### 5. 축하 화면 컴포넌트 (`src/features/celebration/celebration-screen.tsx`)

```typescript
import { formatCurrency } from '~/lib/format';
import { Confetti } from './confetti';

interface Props {
  totalEarnings: number;
  onClose: () => void;
}

export function CelebrationScreen({ totalEarnings, onClose }: Props) {
  return (
    <>
      <Confetti isActive={true} duration={5000} />

      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold">🎉 축하해요! 🎉</h1>

        <p className="mt-6 text-gray-600">이번 달 열심히 일해서</p>

        <p className="mt-4 text-4xl font-bold text-primary">
          {formatCurrency(totalEarnings)}
        </p>

        <p className="mt-2 text-gray-600">벌었어요!</p>

        <button
          onClick={onClose}
          className="mt-8 rounded bg-primary px-6 py-2 text-white"
        >
          닫기
        </button>
      </div>
    </>
  );
}
```

### 6. 메뉴바 팝업에 통합 (`src/features/menubar/menubar-popup.tsx`)

```typescript
import { useSalaryCalculator } from '~/hooks/use-salary-calculator';
import { useUserSettings } from '~/hooks/use-user-settings';
import { useHolidays } from '~/hooks/use-holidays';
import { useCelebrationStore } from '~/stores/celebration-store';
import { isPayday, isWorkingHours, getActualPayday } from '~/lib/payday-utils';
import { CelebrationScreen } from '../celebration/celebration-screen';

export function MenubarPopup() {
  const { data: settings } = useUserSettings();
  const salaryInfo = useSalaryCalculator(settings ?? null);
  const { data: holidays = [] } = useHolidays();

  const canShowCelebration = useCelebrationStore((s) => s.canShowCelebration);
  const dismissCelebration = useCelebrationStore((s) => s.dismissCelebration);

  // 축하 화면 표시 조건 확인
  const shouldShowCelebration = () => {
    if (!settings || !salaryInfo) return false;

    const today = new Date();
    const actualPayday = getActualPayday(
      today.getFullYear(),
      today.getMonth(),
      settings.payDay,
      holidays,
    );
    const paydayStr = actualPayday.toISOString().split('T')[0];

    return (
      isPayday(settings.payDay, holidays) &&
      isWorkingHours() &&
      canShowCelebration(paydayStr)
    );
  };

  const handleCloseCelebration = () => {
    const today = new Date();
    const actualPayday = getActualPayday(
      today.getFullYear(),
      today.getMonth(),
      settings!.payDay,
      holidays,
    );
    const paydayStr = actualPayday.toISOString().split('T')[0];
    dismissCelebration(paydayStr);
  };

  // 축하 화면 표시
  if (shouldShowCelebration() && salaryInfo) {
    return (
      <CelebrationScreen
        totalEarnings={settings!.monthlyNetSalary}
        onClose={handleCloseCelebration}
      />
    );
  }

  // 일반 팝업 표시
  // ... 기존 코드
}
```

## 파일 구조

```
src/
├── features/
│   └── celebration/
│       ├── celebration-screen.tsx
│       └── confetti.tsx
├── hooks/
│   └── use-holidays.ts
├── lib/
│   └── payday-utils.ts
└── stores/
    └── celebration-store.ts
```

## 완료 조건

- [ ] 실제 월급 지급일 계산 로직 구현 (주말/공휴일 대응)
- [ ] 공휴일 API 연동
- [ ] Confetti 애니메이션 구현
- [ ] 축하 화면 UI 구현
- [ ] 축하 상태 관리 (1회성 표시)
- [ ] 메뉴바 팝업에 축하 화면 통합
- [ ] 근무시간 내 표시 조건 구현

## 의존성

- [Task 3: 급여 계산 엔진](task-3-salary-calculator.md)
- [Task 5: 메뉴바 팝업 UI](task-5-menubar-popup-ui.md)

## 참고

- Confetti 라이브러리: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) 사용 검토
- Raycast confetti 스타일 참고
