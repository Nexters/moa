interface Props {
  value: boolean;
  onSave: (value: boolean) => void;
}

export function ToggleInput({ value, onSave }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onSave(!value)}
      className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${
        value ? 'bg-blue-500' : 'bg-white/20'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          value ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
