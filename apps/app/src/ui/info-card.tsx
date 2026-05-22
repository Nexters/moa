import type { ReactNode } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

import { ChevronRightIcon } from './icons';

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
    <div className="flex h-6 items-center gap-3">
      <span className="b1-400 text-text-medium">{label}</span>
      {children ?? <span className="b1-600 text-text-high">{value}</span>}
    </div>
  );
}

// InfoCardDivider
export function InfoCardDivider() {
  return <hr className="border-divider-secondary" />;
}

// InfoCardButtonRow (클릭 가능한 정보 행 — 우측 chevron 포함)
interface InfoCardButtonRowProps {
  label: string;
  value: string;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function InfoCardButtonRow({
  label,
  value,
  onClick,
  disabled,
  ariaLabel,
}: InfoCardButtonRowProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? label}
      className="-mx-2 flex h-6 cursor-pointer items-center justify-between gap-3 px-2 text-left"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="flex h-6 items-center gap-3">
        <span className="b1-400 text-text-medium">{label}</span>
        <span className="b1-600 text-text-high">{value}</span>
      </span>
      <ChevronRightIcon className="text-text-low size-6 shrink-0" />
    </button>
  );
}
