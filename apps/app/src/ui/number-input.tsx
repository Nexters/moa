import { NumberField } from '@base-ui/react/number-field';
import type { ComponentProps } from 'react';
import { cn } from 'tailwind-variants';

interface NumberInputProps extends ComponentProps<typeof NumberField.Root> {
  suffix?: string;
  formatThousands?: boolean;
}

export function NumberInput({
  className,
  suffix = '원',
  formatThousands = true,
  ...props
}: NumberInputProps) {
  return (
    <NumberField.Root
      {...props}
      locale="ko-KR"
      format={formatThousands ? { useGrouping: true } : { useGrouping: false }}
      className={cn(
        'bg-container-primary focus-within:border-green-40 relative w-full rounded-sm border border-transparent',
        className,
      )}
    >
      <NumberField.Input className="b1-600 text-text-high placeholder:text-text-low w-full bg-transparent px-4 py-3 pr-10 text-right focus:outline-none" />
      {suffix && (
        <span className="b1-600 text-text-medium pointer-events-none absolute top-1/2 right-4 -translate-y-1/2">
          {suffix}
        </span>
      )}
    </NumberField.Root>
  );
}
