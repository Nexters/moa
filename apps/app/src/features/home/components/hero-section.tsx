import NumberFlow, { continuous } from '@number-flow/react';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';
import { cn } from 'tailwind-variants';

import { HolidayIcon, MoaMoneyIcon } from '~/ui/icons';

type HeroVariant = 'empty' | 'partial' | 'full' | 'holiday';

interface HeroSectionProps {
  variant: HeroVariant;
  label: string;
  amount: number;
}

export function HeroSection({ variant, label, amount }: HeroSectionProps) {
  const isHoliday = variant === 'holiday';
  const [animKey, setAnimKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => {
      cancelAnimationFrame(id);
    };
  }, [animKey]);

  useEffect(() => {
    const cleanup = listen('menubar_panel_did_open', () => {
      setMounted(false);
      setAnimKey((prev) => prev + 1);
    });
    return () => {
      void cleanup.then((fn) => fn());
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-5">
      {isHoliday ? (
        <HolidayIcon />
      ) : variant === 'partial' ? (
        <div key={animKey} className="relative">
          <MoaMoneyIcon variant="empty" />
          <MoaMoneyIcon
            variant="partial"
            className="absolute inset-0 animate-[fill-up_4s_ease-out_infinite]"
          />
        </div>
      ) : (
        <MoaMoneyIcon variant={variant} />
      )}
      <div className="flex flex-col items-center gap-1">
        <p className="t3-500 text-text-high">{label}</p>
        <div className="flex items-center justify-center gap-1">
          <NumberFlow
            key={animKey}
            value={mounted ? amount : 0}
            locales="ko-KR"
            format={{ maximumFractionDigits: 0 }}
            plugins={[continuous]}
            className={cn(
              'h1-700 tabular-nums',
              isHoliday ? 'text-blue' : 'text-text-high',
            )}
          />
          <p className="h3-500 text-text-medium">원</p>
        </div>
      </div>
    </div>
  );
}
