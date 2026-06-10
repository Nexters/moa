import { cn } from 'tailwind-variants';

import { CheckIcon } from './icons';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
  className,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-3 disabled:cursor-not-allowed',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg p-1 transition-colors',
          checked
            ? 'bg-green-40'
            : 'bg-container-primary group-hover:bg-interactive-hover',
        )}
      >
        <CheckIcon
          className={cn(
            'size-5 transition-colors',
            checked ? 'text-gray-90' : 'text-text-disabled',
          )}
        />
      </span>
      <span className="b1-500 text-text-high text-left">{label}</span>
    </button>
  );
}
