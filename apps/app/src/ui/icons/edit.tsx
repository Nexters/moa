import type { ComponentProps } from 'react';

export function EditIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4.16732 13.3333L3.33398 16.6667L6.66732 15.8333L16.3221 6.17851C16.973 5.52764 16.973 4.47236 16.3221 3.82149L16.1792 3.67851C15.5283 3.02764 14.473 3.02764 13.8221 3.67851L4.16732 13.3333Z"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M12.5 5L15 7.5"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M10.834 16.6666H17.5007"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}
