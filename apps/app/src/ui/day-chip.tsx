import { cn } from 'tailwind-variants';

interface DayChipProps {
  day: number;
  label: string;
  selected: boolean;
  onToggle: (day: number) => void;
}

export function DayChip({ day, label, selected, onToggle }: DayChipProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(day)}
      className={cn(
        'b2-600 flex flex-1 basis-0 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-sm p-2.5 transition-colors',
        selected
          ? 'bg-text-high text-text-high-reverse'
          : 'bg-container-primary text-text-disabled hover:bg-interactive-hover',
      )}
    >
      {label}
    </button>
  );
}

interface DayChipGroupProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}

const DAYS = [
  { day: 1, label: '월' },
  { day: 2, label: '화' },
  { day: 3, label: '수' },
  { day: 4, label: '목' },
  { day: 5, label: '금' },
  { day: 6, label: '토' },
  { day: 0, label: '일' },
];

export function DayChipGroup({ selectedDays, onChange }: DayChipGroupProps) {
  const handleToggle = (day: number) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b);
    onChange(newDays);
  };

  return (
    <div className="flex w-full gap-2 self-stretch">
      {DAYS.map(({ day, label }) => (
        <DayChip
          key={day}
          day={day}
          label={label}
          selected={selectedDays.includes(day)}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}
