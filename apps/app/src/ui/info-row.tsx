import type { ReactNode } from 'react';
import { tv } from 'tailwind-variants';

import { ChevronRightIcon } from './icons';

const infoRowVariants = tv({
  base: 'b1-500 bg-container-primary flex items-center justify-between rounded-md px-4 py-3.5',
  variants: {
    interactive: {
      true: 'hover:bg-interactive-hover cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    },
    danger: {
      true: '',
    },
  },
});

interface Props {
  as?: 'div' | 'button';
  label: string;
  danger?: boolean;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function InfoRow({
  as = 'div',
  label,
  danger,
  children,
  onClick,
  disabled,
}: Props) {
  const Component = as;
  const isButton = as === 'button';

  return (
    <Component
      type={isButton ? 'button' : undefined}
      onClick={onClick}
      disabled={disabled}
      className={infoRowVariants({ interactive: isButton, danger })}
    >
      <span className={danger ? 'text-error' : 'text-text-high'}>{label}</span>
      {(children || isButton) && (
        <span className="flex items-center gap-1">
          {children}
          {isButton && (
            <ChevronRightIcon
              className={danger ? 'text-error size-6' : 'text-text-low size-6'}
            />
          )}
        </span>
      )}
    </Component>
  );
}
