import { useState } from 'react';

interface Props {
  value: string;
  onSave: (value: string) => void;
}

export function TextInput({ value, onSave }: Props) {
  const [localValue, setLocalValue] = useState(value);
  const hasChanged = localValue !== value && localValue.trim() !== '';

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none"
      />
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
