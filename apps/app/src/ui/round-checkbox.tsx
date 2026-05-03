import { cn } from 'tailwind-variants';

import { CheckIcon } from './icons';

interface RoundCheckboxProps {
  checked: boolean;
  className?: string;
}

export function RoundCheckbox({ checked, className }: RoundCheckboxProps) {
  return (
    <span
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors',
        checked
          ? 'bg-green-40 border-green-40 text-gray-90'
          : 'border-text-low text-transparent',
        className,
      )}
      aria-hidden="true"
    >
      <CheckIcon className="size-4" />
    </span>
  );
}
