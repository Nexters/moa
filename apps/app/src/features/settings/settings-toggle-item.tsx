import { SwitchInput } from '~/ui';

interface Props {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function SettingsToggleItem({
  label,
  value,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div className="b2-400 flex items-center justify-between px-4 py-3 first:rounded-t-md last:rounded-b-md">
      <span className="text-text-high">{label}</span>
      <SwitchInput value={value} onSave={onChange} disabled={disabled} />
    </div>
  );
}
