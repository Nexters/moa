import type { ComponentProps } from 'react';

interface KakaoLogoIconProps extends Omit<ComponentProps<'svg'>, 'children'> {}

export function KakaoLogoIcon({ className, ...props }: KakaoLogoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.0001 3.6001C7.02919 3.6001 3 6.71307 3 10.5524C3 12.9402 4.55841 15.0451 6.93154 16.2971L5.93304 19.9447C5.84482 20.267 6.21343 20.5239 6.49648 20.3371L10.8734 17.4484C11.2427 17.484 11.6181 17.5048 12.0001 17.5048C16.9705 17.5048 21 14.392 21 10.5524C21 6.71307 16.9705 3.6001 12.0001 3.6001Z"
        fill="#141414"
      />
    </svg>
  );
}
