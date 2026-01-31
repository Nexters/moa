import { useEffect, useRef, useState } from 'react';
import { cn } from 'tailwind-variants';

import { ArrowRightIcon } from './icons';
import { TimeInput } from './time-input';

// ============================================================================
// Types
// ============================================================================

export interface TimePeriodValue {
  startTime: string;
  endTime: string;
}

// ============================================================================
// Utilities
// ============================================================================

export function isTimePeriodValid(value: TimePeriodValue): boolean {
  return value.startTime < value.endTime;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_VALUE: TimePeriodValue = {
  startTime: '00:00',
  endTime: '00:00',
};

// ============================================================================
// TimePeriodInput
// ============================================================================

interface TimePeriodInputProps {
  autoFocus?: boolean;
  className?: string;
  value?: TimePeriodValue;
  defaultValue?: TimePeriodValue;
  onChange?: (value: TimePeriodValue) => void;
}

export function TimePeriodInput({
  autoFocus,
  className,
  value: valueProp,
  defaultValue = DEFAULT_VALUE,
  onChange: onChangeProp,
}: TimePeriodInputProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : uncontrolledValue;

  const startHourRef = useRef<HTMLInputElement>(null);
  const startMinuteRef = useRef<HTMLInputElement>(null);
  const endHourRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      startHourRef.current?.focus();
    }
  }, [autoFocus]);

  const handleChange = (newValue: TimePeriodValue) => {
    if (!isControlled) {
      setUncontrolledValue(newValue);
    }
    onChangeProp?.(newValue);
  };

  return (
    <div className={cn('flex items-center gap-5', className)}>
      <TimeInput
        value={value.startTime}
        onChange={(startTime) => handleChange({ ...value, startTime })}
        hourRef={startHourRef}
        minuteRef={startMinuteRef}
        onRightFocus={() => endHourRef.current?.focus()}
      />
      <ArrowRightIcon className="text-text-low" />
      <TimeInput
        value={value.endTime}
        onChange={(endTime) => handleChange({ ...value, endTime })}
        hourRef={endHourRef}
        onLeftFocus={() => startMinuteRef.current?.focus()}
      />
    </div>
  );
}
