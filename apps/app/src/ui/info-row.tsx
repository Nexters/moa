import type { ReactNode } from 'react';
import { tv } from 'tailwind-variants';

import { ArrowRightIcon } from './icons';

const infoRowVariants = tv({
  base: 'b2-400 flex items-center justify-between px-4 py-3.5 first:rounded-t-md last:rounded-b-md',
  variants: {
    interactive: {
      true: 'hover:bg-interactive-hover cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    },
  },
});

interface Props {
  as?: 'div' | 'button';
  label: string;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function InfoRow({
  as = 'div',
  label,
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
      className={infoRowVariants({ interactive: isButton })}
    >
      <span className="text-text-high">{label}</span>
      {(children || isButton) && (
        <span className="flex items-center gap-1">
          {children}
          {isButton && <ArrowRightIcon className="text-text-low size-4" />}
        </span>
      )}
    </Component>
  );
}
