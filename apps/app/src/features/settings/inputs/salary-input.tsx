import { useState } from 'react';

interface Props {
  value: number;
  onSave: (value: number) => void;
}

export function SalaryInput({ value, onSave }: Props) {
  const [localValue, setLocalValue] = useState(value.toLocaleString());

  const handleSave = () => {
    const num = parseInt(localValue.replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      onSave(num);
    }
  };

  const parsedValue = parseInt(localValue.replace(/,/g, ''), 10);
  const hasChanged =
    !isNaN(parsedValue) && parsedValue !== value && parsedValue > 0;

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          inputMode="numeric"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 pr-8 text-right text-sm transition-colors focus:border-blue-500 focus:outline-none"
          placeholder="3,000,000"
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-400">
          원
        </span>
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={!hasChanged}
        className="cursor-pointer rounded-lg bg-blue-500 px-3 py-2 text-sm text-white transition-opacity disabled:cursor-default disabled:opacity-50"
      >
        저장
      </button>
    </div>
  );
}
