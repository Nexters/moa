import { useEffect, useRef, useState } from 'react';
import { cn } from 'tailwind-variants';

import { ArrowRightIcon, ClockIcon } from './icons';
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

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getTimeDiffInMinutes(value: TimePeriodValue): number {
  const start = parseTimeToMinutes(value.startTime);
  const end = parseTimeToMinutes(value.endTime);
  if (end > start) return end - start;
  return 24 * 60 - start + end;
}

function formatDuration(totalMinutes: number): string | null {
  if (totalMinutes === 0) return null;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `총 ${hours}시간 ${minutes}분 근무해요.`;
  if (hours > 0) return `총 ${hours}시간 근무해요.`;
  return `총 ${minutes}분 근무해요.`;
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

  const duration = formatDuration(getTimeDiffInMinutes(value));

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-3">
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
      {duration && (
        <div className="flex items-center gap-1">
          <ClockIcon className="text-green-40" />
          <span className="b2-500 text-green-40">{duration}</span>
        </div>
      )}
    </div>
  );
}
