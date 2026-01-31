import type { ComponentProps } from 'react';

export function ArrowRightIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7.99935 12.6667L12.666 8.00008M12.666 8.00008L7.99935 3.33341M12.666 8.00008L3.36352 8.00008"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
