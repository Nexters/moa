import { Input } from '@base-ui/react/input';
import { type ChangeEvent, type ComponentProps } from 'react';

interface TimeInputProps extends Omit<
  ComponentProps<'input'>,
  'value' | 'onChange' | 'type'
> {
  value: string;
  onChange: (value: string) => void;
}

export function TimeInput({ value, onChange, ...props }: TimeInputProps) {
  return (
    <Input
      type="time"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      className="bg-container-primary b1-500 text-text-high w-full rounded-md px-4 py-3 scheme-dark focus:outline-none"
      {...props}
    />
  );
}
