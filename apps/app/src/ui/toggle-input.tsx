import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { cn } from 'tailwind-variants';

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
      className={cn('flex w-full gap-3', className)}
    >
      {options.map((option) => (
        <Toggle
          key={option.value}
          value={option.value}
          className={cn(
            'bg-container-primary flex h-14 flex-1 cursor-pointer items-center justify-center rounded-md px-4',
            'transition-colors duration-150 ease-in-out',
            option.value === value
              ? 'b1-600 text-text-high'
              : 'b1-500 text-text-disabled hover:bg-interactive-hover',
          )}
        >
          {option.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
