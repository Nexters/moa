import type { ComponentProps } from 'react';
import { cn } from 'tailwind-variants';

export function ChevronDownIcon({
  className,
  ...props
}: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-6', className)}
      {...props}
    >
      <path
        d="M6.99965 10L11.9996 15L17.0312 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightIcon({
  className,
  ...props
}: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-6', className)}
      {...props}
    >
      <path
        d="M10 6.99989L15 11.9999L10 17.0315"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
