import { Input } from '@base-ui/react/input';
import {
  type KeyboardEvent,
  type Ref,
  type RefObject,
  useRef,
  useState,
} from 'react';
import { cn } from 'tailwind-variants';

// ============================================================================
// Types
// ============================================================================

type Picker = 'hours' | 'minutes';

// ============================================================================
// Utils
// ============================================================================

function getValidNumber(
  value: string,
  { max, min = 0 }: { max: number; min?: number },
): string {
  const num = Number.parseInt(value, 10);

  if (Number.isNaN(num)) return min.toString().padStart(2, '0');
  if (num > max) return max.toString().padStart(2, '0');
  if (num < min) return min.toString().padStart(2, '0');

  return num.toString().padStart(2, '0');
}

function getValidHour(value: string): string {
  return getValidNumber(value, { max: 23 });
}

function getValidMinute(value: string): string {
  return getValidNumber(value, { max: 59 });
}

function getValidArrowNumber(
  value: string,
  { min, max, step }: { min: number; max: number; step: number },
): string {
  const num = Number.parseInt(value, 10);

  if (Number.isNaN(num)) return min.toString().padStart(2, '0');

  let next = num + step;
  if (next > max) next = min;
  if (next < min) next = max;

  return next.toString().padStart(2, '0');
}

function getValidArrowHour(value: string, step: number): string {
  return getValidArrowNumber(value, { min: 0, max: 23, step });
}

function getValidArrowMinute(value: string, step: number): string {
  return getValidArrowNumber(value, { min: 0, max: 59, step });
}

function getValidByPicker(value: string, picker: Picker): string {
  if (picker === 'hours') return getValidHour(value);
  return getValidMinute(value);
}

function getArrowByPicker(value: string, step: number, picker: Picker): string {
  if (picker === 'hours') return getValidArrowHour(value, step);
  return getValidArrowMinute(value, step);
}

// ============================================================================
// Internal Components
// ============================================================================

interface TimePickerInputProps {
  ref?: Ref<HTMLInputElement>;
  picker: Picker;
  value: string;
  onChange: (value: string) => void;
  onLeftFocus?: () => void;
  onRightFocus?: () => void;
  className?: string;
}

function TimePickerInput({
  ref,
  picker,
  value,
  onChange,
  onLeftFocus,
  onRightFocus,
  className,
}: TimePickerInputProps) {
  const [hasTypedFirstDigit, setHasTypedFirstDigit] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') return;

    e.preventDefault();

    if (e.key === 'ArrowRight') {
      onRightFocus?.();
      return;
    }

    if (e.key === 'ArrowLeft') {
      onLeftFocus?.();
      return;
    }

    if (e.key === 'ArrowUp') {
      onChange(getArrowByPicker(value, 1, picker));
      return;
    }

    if (e.key === 'ArrowDown') {
      onChange(getArrowByPicker(value, -1, picker));
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      onChange('00');
      setHasTypedFirstDigit(false);
      return;
    }

    if (!/^[0-9]$/.test(e.key)) return;

    if (!hasTypedFirstDigit) {
      setHasTypedFirstDigit(true);
      onChange(getValidByPicker(`0${e.key}`, picker));
      return;
    }

    setHasTypedFirstDigit(false);
    const combined = `${value[1]}${e.key}`;
    onChange(getValidByPicker(combined, picker));

    onRightFocus?.();
  };

  return (
    <Input
      ref={ref}
      inputMode="numeric"
      value={value}
      readOnly
      onKeyDown={handleKeyDown}
      className={cn(
        'bg-container-primary b1-500 text-text-high w-[48px] rounded-sm py-1 text-center tabular-nums',
        'focus:bg-container-secondary focus:outline-none',
        className,
      )}
    />
  );
}

// ============================================================================
// Components
// ============================================================================

export interface TimeInputProps {
  className?: string;
  value?: string;
  defaultValue?: string;
  hourRef?: RefObject<HTMLInputElement | null>;
  minuteRef?: RefObject<HTMLInputElement | null>;
  onChange?: (value: string) => void;
  onLeftFocus?: () => void;
  onRightFocus?: () => void;
}

export function TimeInput({
  className,
  value: valueProp,
  defaultValue = '00:00',
  onChange: onChangeProp,
  hourRef: hourRefProp,
  minuteRef: minuteRefProp,
  onLeftFocus,
  onRightFocus,
}: TimeInputProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : uncontrolledValue;

  const parts = value.split(':');
  const hours = parts[0] || '00';
  const minutes = parts[1] || '00';

  const hourRefFallback = useRef<HTMLInputElement>(null);
  const minuteRefFallback = useRef<HTMLInputElement>(null);
  const hourRef = hourRefProp ?? hourRefFallback;
  const minuteRef = minuteRefProp ?? minuteRefFallback;

  const handleChange = (newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue);
    }
    onChangeProp?.(newValue);
  };

  const handleHourChange = (newHours: string) => {
    handleChange(`${newHours}:${minutes}`);
  };

  const handleMinuteChange = (newMinutes: string) => {
    handleChange(`${hours}:${newMinutes}`);
  };

  return (
    <div
      className={cn(
        'bg-container-primary inline-flex w-fit items-center gap-2 rounded-md px-4 py-3',
        className,
      )}
    >
      <TimePickerInput
        ref={hourRef}
        picker="hours"
        value={hours}
        onChange={handleHourChange}
        onLeftFocus={onLeftFocus}
        onRightFocus={() => minuteRef.current?.focus()}
      />
      <span className="b1-500 text-text-medium">:</span>
      <TimePickerInput
        ref={minuteRef}
        picker="minutes"
        value={minutes}
        onChange={handleMinuteChange}
        onLeftFocus={() => hourRef.current?.focus()}
        onRightFocus={onRightFocus}
      />
    </div>
  );
}
