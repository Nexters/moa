import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { cn } from 'tailwind-variants';

import { buttonVariants } from './button';

interface ToggleInputOption<T extends string> {
  value: T;
  label: string;
}

interface ToggleInputProps<T extends string> {
  options: readonly ToggleInputOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
}

export function ToggleInput<T extends string>({
  options,
  value,
  onValueChange,
  className,
  disabled,
}: ToggleInputProps<T>) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        const [first] = next;
        if (first === undefined) return;
        onValueChange(first as T);
      }}
      disabled={disabled}
      className={cn('flex w-full gap-2', className)}
    >
      {options.map((option) => (
        <Toggle
          key={option.value}
          value={option.value}
          className={cn(
            buttonVariants({
              variant: option.value === value ? 'secondary' : 'tertiary',
              rounded: 'md',
              size: 'md',
            }),
            'flex-1',
          )}
        >
          {option.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
