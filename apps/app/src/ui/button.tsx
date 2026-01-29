import { Button as ButtonPrimitive } from '@base-ui/react/button';
import type { ComponentProps } from 'react';
import { tv, VariantProps } from 'tailwind-variants';
import { cn } from 'tailwind-variants';

export const buttonVariants = tv({
  base: 'b1-600 cursor-pointer px-5 transition-colors disabled:cursor-not-allowed',
  variants: {
    variant: {
      primary:
        'bg-green-40 text-gray-90 disabled:bg-gray-70 disabled:text-text-disabled active:bg-green-50',
      secondary:
        'bg-gray-60 text-gray-0 active:bg-gray-70 disabled:bg-gray-70 disabled:text-text-disabled',
      tertiary:
        'bg-gray-0 text-gray-90 active:bg-gray-20 disabled:bg-gray-70 disabled:text-text-disabled',
    },
    rounded: {
      md: 'rounded-md',
      full: 'rounded-full',
    },
    size: {
      md: 'py-3',
      lg: 'py-4',
    },
    fullWidth: {
      true: 'w-full',
    },
  },
  defaultVariants: {
    variant: 'primary',
    rounded: 'md',
    size: 'md',
    fullWidth: false,
  },
});

interface ButtonProps
  extends
    Omit<ComponentProps<typeof ButtonPrimitive>, 'className'>,
    VariantProps<typeof buttonVariants> {
  className?: string;
}

export function Button({
  variant,
  fullWidth,
  rounded,
  size,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      className={cn(
        buttonVariants({ variant, fullWidth, rounded, size, className }),
      )}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  );
}
