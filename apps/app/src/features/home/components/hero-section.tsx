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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const cleanup = listen('menubar_panel_did_open', () => {
      setMounted(false);
      requestAnimationFrame(() => {
        setMounted(true);
      });
    });

    return () => {
      void cleanup.then((fn) => fn());
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-5">
      {isHoliday ? <HolidayIcon /> : <MoaMoneyIcon variant={variant} />}
      <div className="flex flex-col items-center gap-1">
        <p className="t3-500 text-text-high">{label}</p>
        <div className="flex items-center justify-center gap-1">
          <NumberFlow
            value={mounted ? amount : 0}
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
