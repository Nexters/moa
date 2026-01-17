import { useEffect, useState } from 'react';

interface Props {
  value: number;
  onSave: (value: number) => void;
}

export function PayDaySelect({ value, onSave }: Props) {
  const [localValue, setLocalValue] = useState(value);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hasChanged = localValue !== value;

  // Sync local state when prop changes (e.g., after save + cache invalidation)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="flex gap-2">
      <select
        value={localValue}
        onChange={(e) => setLocalValue(Number(e.target.value))}
        className="flex-1 cursor-pointer rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none"
      >
        {days.map((day) => (
          <option key={day} value={day} className="bg-neutral-900">
            {day}일
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onSave(localValue)}
        disabled={!hasChanged}
        className="cursor-pointer rounded-lg bg-blue-500 px-3 py-2 text-sm text-white transition-opacity disabled:cursor-default disabled:opacity-50"
      >
        저장
      </button>
    </div>
  );
}
