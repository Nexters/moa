import { formatNumber } from '~/lib/format';
import { MoaMoneyIcon } from '~/ui/icons';

type IconVariant = 'empty' | 'partial' | 'full';

interface HeroSectionProps {
  variant: IconVariant;
  label: string;
  amount: number;
}

export function HeroSection({ variant, label, amount }: HeroSectionProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <MoaMoneyIcon variant={variant} />
      <p className="b2-400 text-text-medium">{label}</p>
      <div className="flex items-end justify-center gap-1">
        <p className="h1-700 text-green-40 tabular-nums">
          {formatNumber(amount)}
        </p>
        <p className="h3-500 text-text-medium">원</p>
      </div>
    </div>
  );
}
