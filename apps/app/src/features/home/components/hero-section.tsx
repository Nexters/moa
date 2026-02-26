import NumberFlow, { continuous } from '@number-flow/react';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';
import { cn } from 'tailwind-variants';

import { HeroIcon, type HeroIconVariant } from '~/ui';

interface HeroSectionProps {
  variant: HeroIconVariant;
  label: string;
  amount: number;
  highlighted?: boolean;
}

export function HeroSection({
  variant,
  label,
  amount,
  highlighted,
}: HeroSectionProps) {
  const amountColor = highlighted
    ? 'text-green-40'
    : variant === 'holiday'
      ? 'text-blue'
      : 'text-text-high';
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
      <HeroIcon variant={variant} />
      <div className="flex flex-col items-center">
        <p className="t3-500 text-text-high">{label}</p>
        <div className="flex items-center justify-center gap-1">
          <NumberFlow
            key={animKey}
            value={mounted ? Math.floor(amount) : 0}
            locales="ko-KR"
            format={{ maximumFractionDigits: 0 }}
            plugins={[continuous]}
            className={cn('h1-700 tabular-nums', amountColor)}
          />
          <p className="h3-500 text-text-medium">원</p>
        </div>
      </div>
    </div>
  );
}
