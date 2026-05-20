import { cn } from 'tailwind-variants';

import { formatKoreanAmount } from '~/lib/format';

import { Field } from './field';
import { AttentionCircleIcon } from './icons';
import { NumberInput } from './number-input';

interface AmountInputProps {
  value: number;
  onValueChange: (value: number) => void;
  error?: string;
  max?: number;
  defaultValue?: number;
  className?: string;
}

export function AmountInput({
  value,
  onValueChange,
  error,
  max,
  defaultValue,
  className,
}: AmountInputProps) {
  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <NumberInput
        suffix="원"
        value={value}
        onValueChange={(v) => onValueChange(v ?? 0)}
        max={max}
        defaultValue={defaultValue}
      />
      {error ? (
        <Field.Error className="flex items-center gap-1">
          <AttentionCircleIcon aria-hidden="true" focusable={false} />
          <span>{error}</span>
        </Field.Error>
      ) : (
        <p className="b2-500 text-green-40 self-end">
          {formatKoreanAmount(value)}
        </p>
      )}
    </div>
  );
}
