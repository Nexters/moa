import { cn } from 'tailwind-variants';

interface RoundCheckboxProps {
  checked: boolean;
  className?: string;
}

function CheckedRoundCheckbox({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-6 shrink-0', className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="12" fill="#1FD683" />
      <path
        d="M7.5 12.5L10.5 15.5L16.5 9.5"
        stroke="#141414"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UncheckedRoundCheckbox({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-6 shrink-0', className)}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="11.25"
        stroke="white"
        strokeOpacity="0.28"
        strokeWidth="1.5"
      />
      <path
        d="M7.5 12.5L10.5 15.5L16.5 9.5"
        stroke="white"
        strokeOpacity="0.28"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RoundCheckbox({ checked, className }: RoundCheckboxProps) {
  if (checked) {
    return <CheckedRoundCheckbox className={className} />;
  }

  return <UncheckedRoundCheckbox className={className} />;
}
