import { ArrowRightIcon } from '~/ui';

interface Props {
  label: string;
  value: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function SalaryInfoItem({
  label,
  value,
  onClick,
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-b2-400 hover:bg-interactive-hover flex items-center justify-between px-4 py-3.5 transition-colors first:rounded-t-md last:rounded-b-md disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="text-text-high">{label}</span>
      <span className="flex items-center gap-1">
        <span className="text-green-40">{value}</span>
        <ArrowRightIcon className="text-text-low size-4" />
      </span>
    </button>
  );
}
