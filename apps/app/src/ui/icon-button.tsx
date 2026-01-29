import type { ComponentProps } from 'react';
import { cn } from 'tailwind-variants';

type Size = 'sm' | 'md';

interface IconButtonProps extends Omit<ComponentProps<'button'>, 'className'> {
  size?: Size;
  className?: string;
}

const sizeStyles: Record<Size, string> = {
  sm: 'size-10',
  md: 'size-11',
};

export function IconButton({
  size = 'md',
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'text-text-high active:text-text-medium disabled:text-text-disabled flex cursor-pointer items-center justify-center transition-colors disabled:cursor-not-allowed',
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
