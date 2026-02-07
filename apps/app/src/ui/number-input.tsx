import { NumberField } from '@base-ui/react/number-field';
import type { ComponentProps } from 'react';
import { cn } from 'tailwind-variants';

interface NumberInputProps extends ComponentProps<typeof NumberField.Root> {
  suffix?: string;
  formatThousands?: boolean;
}

export function NumberInput({
  className,
  suffix = '만원',
  formatThousands = true,
  ...props
}: NumberInputProps) {
  return (
    <NumberField.Root
      {...props}
      locale="ko-KR"
      format={formatThousands ? { useGrouping: true } : { useGrouping: false }}
      className={cn(
        'bg-container-primary focus-within:border-green-40 flex w-full items-center rounded-sm border border-transparent',
        className,
      )}
    >
      <NumberField.Input className="b1-600 text-text-high placeholder:text-text-low min-w-0 flex-1 bg-transparent px-4 py-3 focus:outline-none" />
      {suffix && (
        <span className="b1-600 text-text-medium pointer-events-none shrink-0 pr-4 pl-1">
          {suffix}
        </span>
      )}
    </NumberField.Root>
  );
}
