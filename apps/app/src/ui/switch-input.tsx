import { Switch } from '@base-ui/react/switch';
import { cn } from 'tailwind-variants';

interface SwitchInputProps {
  value: boolean;
  onSave: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function SwitchInput({
  value,
  onSave,
  disabled = false,
  className,
}: SwitchInputProps) {
  return (
    <Switch.Root
      checked={value}
      onCheckedChange={onSave}
      disabled={disabled}
      className={cn(
        'relative h-6 w-11 cursor-pointer rounded-full transition-colors',
        'data-checked:bg-green-40 bg-white/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      <Switch.Thumb
        className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
          'data-checked:translate-x-5 data-unchecked:translate-x-0',
        )}
      />
    </Switch.Root>
  );
}
