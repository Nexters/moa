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
      <path
        d="M12 2.2002C17.4124 2.2002 21.7998 6.58761 21.7998 12C21.7997 17.4123 17.4123 21.7998 12 21.7998C6.58765 21.7998 2.20026 17.4123 2.2002 12C2.2002 6.58761 6.58761 2.2002 12 2.2002ZM15.6367 9.36328C15.2852 9.01181 14.7148 9.01181 14.3633 9.36328L11 12.7266L9.63672 11.3633C9.28525 11.0118 8.71475 11.0118 8.36328 11.3633C8.01181 11.7148 8.01181 12.2852 8.36328 12.6367L10.3633 14.6367C10.7148 14.9882 11.2852 14.9882 11.6367 14.6367L15.6367 10.6367C15.9882 10.2852 15.9882 9.71475 15.6367 9.36328Z"
        fill="#1FD683"
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
        r="9"
        stroke="white"
        strokeOpacity="0.28"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 10L11 14L9 12"
        stroke="white"
        strokeOpacity="0.28"
        strokeWidth="1.6"
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
