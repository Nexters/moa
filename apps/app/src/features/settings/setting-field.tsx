interface Props {
  label: string;
  children: React.ReactNode;
}

export function SettingField({ label, children }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-400">{label}</label>
      {children}
    </div>
  );
}
