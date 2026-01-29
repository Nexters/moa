import { ArrowRightIcon } from '~/ui';

interface Props {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function SettingsNavItem({ label, onClick, disabled = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-b2-400 text-text-high hover:bg-interactive-hover flex items-center justify-between px-4 py-3.5 transition-colors first:rounded-t-md last:rounded-b-md disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>{label}</span>
      <ArrowRightIcon className="text-text-low size-4" />
    </button>
  );
}
