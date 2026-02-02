import { cn } from 'tailwind-variants';

import { formatNumber } from '~/lib/format';
import { HolidayIcon, MoaMoneyIcon } from '~/ui/icons';

type HeroVariant = 'empty' | 'partial' | 'full' | 'holiday';

interface HeroSectionProps {
  variant: HeroVariant;
  label: string;
  amount: number;
}

export function HeroSection({ variant, label, amount }: HeroSectionProps) {
  const isHoliday = variant === 'holiday';

  return (
    <div className="flex flex-col items-center gap-5">
      {isHoliday ? <HolidayIcon /> : <MoaMoneyIcon variant={variant} />}
      <div className="flex flex-col items-center gap-1">
        <p className="t3-500 text-text-high">{label}</p>
        <div className="flex items-center justify-center gap-1">
          <p
            className={cn(
              'h1-700 tabular-nums',
              isHoliday ? 'text-blue' : 'text-text-high',
            )}
          >
            {formatNumber(amount)}
          </p>
          <p className="h3-500 text-text-medium">원</p>
        </div>
      </div>
    </div>
  );
}
