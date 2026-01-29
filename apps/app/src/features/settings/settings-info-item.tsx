interface Props {
  label: string;
  value: string;
}

export function SettingsInfoItem({ label, value }: Props) {
  return (
    <div className="text-b2-400 flex items-center justify-between px-4 py-3.5 first:rounded-t-md last:rounded-b-md">
      <span className="text-text-high">{label}</span>
      <span className="text-text-medium">{value}</span>
    </div>
  );
}
