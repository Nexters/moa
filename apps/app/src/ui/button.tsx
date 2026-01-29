import type { ComponentProps } from 'react';

import { cn } from '@moa/shared';

type Variant = 'primary' | 'secondary' | 'tertiary';
type Rounded = 'md' | 'full';
type Size = 'md' | 'lg';

interface ButtonProps extends Omit<ComponentProps<'button'>, 'className'> {
  variant?: Variant;
  fullWidth?: boolean;
  rounded?: Rounded;
  size?: Size;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-green-40 text-gray-90 active:bg-green-50 disabled:bg-gray-70 disabled:text-text-disabled',
  secondary:
    'bg-gray-60 text-gray-0 active:bg-gray-70 disabled:bg-gray-70 disabled:text-text-disabled',
  tertiary:
    'bg-gray-0 text-gray-90 active:bg-gray-20 disabled:bg-gray-70 disabled:text-text-disabled',
};

const roundedStyles: Record<Rounded, string> = {
  md: 'rounded-md',
  full: 'rounded-full',
};

const sizeStyles: Record<Size, string> = {
  md: 'py-3',
  lg: 'py-4',
};

export function Button({
  variant = 'primary',
  fullWidth = false,
  rounded = 'md',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'text-b1-600 cursor-pointer px-5 transition-colors disabled:cursor-not-allowed',
        variantStyles[variant],
        roundedStyles[rounded],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
