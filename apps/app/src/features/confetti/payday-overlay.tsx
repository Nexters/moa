import NumberFlow, { continuous } from '@number-flow/react';
import { useEffect, useState } from 'react';
import { cn } from 'tailwind-variants';

import { formatMonth } from '~/lib/format';
import type { SalaryType } from '~/lib/tauri-bindings';

interface PaydayOverlayProps {
  salaryAmount: number;
  salaryType: SalaryType;
  onClose: () => void;
}

export function PaydayOverlay({
  salaryAmount,
  salaryType,
  onClose,
}: PaydayOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const monthlySalary =
    salaryType === 'yearly' ? Math.floor(salaryAmount / 12) : salaryAmount;

  // fade-in: 다음 프레임에 opacity 1로 전환
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setVisible(true);
      setMounted(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // 3초 후 fade-out
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center pb-10',
        'bg-dim-dark backdrop-blur-md',
        'transition-opacity',
        visible ? 'opacity-100 duration-300' : 'opacity-0 duration-700',
      )}
      onTransitionEnd={() => {
        if (!visible) onClose();
      }}
    >
      {/* 초록색 blob */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-50 opacity-50 blur-[80px]" />

      {/* 콘텐츠 */}
      <div className="relative flex flex-col items-center px-5">
        <p className="b2-500 text-text-medium">{formatMonth()} 누적 월급</p>

        <div className="flex items-baseline justify-center gap-1">
          <NumberFlow
            value={mounted ? Math.floor(monthlySalary) : 0}
            locales="ko-KR"
            format={{ maximumFractionDigits: 0 }}
            plugins={[continuous]}
            className="h2-700 text-green-40 tabular-nums"
          />
          <span className="h3-500 text-text-medium">원</span>
        </div>

        <p className="t3-500 text-text-high mt-1 text-center">
          오늘은 월급날!
          <br />
          한달간 열심히 일한 보상이에요
        </p>

        <p className="c1-400 text-text-low mt-2 text-center">
          누적 월급액은 입력한 월급/연봉을 기준으로 계산된
          <br />
          금액이에요. 실제 급여와 다를 수 있어요.
        </p>
      </div>
    </div>
  );
}
