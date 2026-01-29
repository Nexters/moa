import type { ReactNode } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

// InfoCard 컨테이너
const infoCardVariants = tv({
  base: 'bg-container-primary flex flex-col rounded-lg',
  variants: {
    spacing: {
      default: 'gap-3.5 p-4',
      compact: 'p-4',
    },
  },
  defaultVariants: {
    spacing: 'default',
  },
});

interface InfoCardProps extends VariantProps<typeof infoCardVariants> {
  children: ReactNode;
  className?: string;
}

export function InfoCard({ spacing, children, className }: InfoCardProps) {
  return (
    <div className={infoCardVariants({ spacing, className })}>{children}</div>
  );
}

// InfoCardRow (정보 표시용)
interface InfoCardRowProps {
  label: string;
  value?: string;
  children?: ReactNode;
}

export function InfoCardRow({ label, value, children }: InfoCardRowProps) {
  return (
    <div className="flex h-6 items-center justify-between">
      <span className="b1-400 text-text-medium">{label}</span>
      {children ?? <span className="b1-600 text-text-high">{value}</span>}
    </div>
  );
}

// InfoCardDivider
export function InfoCardDivider() {
  return <hr className="border-divider-secondary" />;
}
