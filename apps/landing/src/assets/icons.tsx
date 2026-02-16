import type { ComponentProps } from 'react';

type SvgProps = Omit<ComponentProps<'svg'>, 'children'>;

export function MoaLogo({ className, ...props }: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 52 17"
      fill="none"
      {...props}
    >
      <path
        d="M40.4678 15.9621H36.9561L42.397 0.217529H46.5807L52.0004 15.9621H48.5098L47.3283 12.3303H41.6487L40.4672 15.9621H40.4678ZM42.4727 9.78567H46.5049L44.543 3.76202H44.4346L42.4727 9.78567Z"
        fill="currentColor"
      />
      <path
        d="M37.0642 8.0895C37.0642 13.2326 33.8887 16.179 29.7371 16.179C25.5855 16.179 22.3882 13.2108 22.3882 8.0895C22.3882 2.96818 25.5534 0 29.7371 0C33.9208 0 37.0642 2.94636 37.0642 8.0895ZM25.7048 8.0895C25.7048 11.4492 27.2984 13.2763 29.7371 13.2872C32.1546 13.2763 33.7584 11.4498 33.7475 8.0895C33.7584 4.71893 32.154 2.90272 29.7371 2.89181C27.2984 2.90272 25.7048 4.71829 25.7048 8.0895Z"
        fill="currentColor"
      />
      <path
        d="M2.3458 0.217529H6.10015L10.4571 11.6365H10.6304L14.988 0.217529H18.7424L19.5747 15.9621H16.5141L15.855 5.65396H15.7248L11.6277 15.9621H9.45982L5.36276 5.61096H5.23248L4.67735 15.9621H1.51343L2.3458 0.217529Z"
        fill="currentColor"
      />
      <path
        d="M21.0885 7.57471H0V9.81833H21.0885V7.57471Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function AppleIcon({ className, ...props }: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

export function AndroidIcon({ className, ...props }: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0012 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31A5.983 5.983 0 006 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" />
    </svg>
  );
}

export function WindowsIcon({ className, ...props }: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .08V5.21L20 3zm-10 9.25L20 12.25V21l-10-1.91V12.25zM3 12.5l6 .09v6.72l-6-1.09V12.5z" />
    </svg>
  );
}

export function DownloadIcon({ className, ...props }: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function AppStoreIcon({ className, ...props }: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M19.1496 0H4.84739C2.16873 0 0 2.16873 0 4.84739V19.1526C0 21.8283 2.16873 23.997 4.84739 23.997H19.1526C21.8283 23.997 24 21.8283 24 19.1496V4.84739C23.997 2.16873 21.8283 0 19.1496 0Z"
        fill="url(#appstore_grad)"
      />
      <path
        d="M11.8965 5.51331L12.3825 4.67342C12.6824 4.14848 13.3513 3.9715 13.8763 4.27147C14.4012 4.57143 14.5782 5.24035 14.2782 5.76528L9.5958 13.8703H12.9824C14.0802 13.8703 14.6952 15.1601 14.2182 16.054H4.28946C3.68354 16.054 3.1976 15.5681 3.1976 14.9621C3.1976 14.3562 3.68354 13.8703 4.28946 13.8703H7.07312L10.6367 7.69404L9.52381 5.76228C9.22385 5.23735 9.40083 4.57443 9.92576 4.26847C10.4507 3.9685 11.1136 4.14548 11.4196 4.67042L11.8965 5.51331ZM7.68504 17.1789L6.63517 18.9996C6.33521 19.5246 5.66629 19.7015 5.14136 19.4016C4.61642 19.1016 4.43945 18.4327 4.73941 17.9078L5.51931 16.5579C6.4012 16.285 7.11811 16.4949 7.68504 17.1789ZM16.7259 13.8763H19.5666C20.1725 13.8763 20.6584 14.3622 20.6584 14.9681C20.6584 15.5741 20.1725 16.06 19.5666 16.06H17.9888L19.0536 17.9078C19.3536 18.4327 19.1766 19.0956 18.6517 19.4016C18.1267 19.7015 17.4638 19.5246 17.1579 18.9996C15.3641 15.889 14.0172 13.5613 13.1234 12.0105C12.2085 10.4327 12.8624 8.84889 13.5073 8.31196C14.2242 9.54181 15.2951 11.3986 16.7259 13.8763Z"
        fill="white"
      />
      <defs>
        <linearGradient
          id="appstore_grad"
          x1="12"
          y1="0"
          x2="12"
          y2="23.997"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#18BFFB" />
          <stop offset="1" stopColor="#2072F3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function PlayStoreIcon({ className, ...props }: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M2.40159 1.46127C2.14717 1.7213 1.99994 2.12613 1.99994 2.65041V21.351C1.99994 21.8752 2.14717 22.2801 2.40159 22.5401L2.46438 22.5972L13.1975 12.1222V11.8749L2.46438 1.39997L2.40159 1.46127Z"
        fill="url(#playstore_g1)"
      />
      <path
        d="M16.7712 15.6147L13.1974 12.1213V11.874L16.7755 8.3806L16.8556 8.42605L21.093 10.78C22.3023 11.448 22.3023 12.5473 21.093 13.2196L16.8556 15.5693L16.7712 15.6147Z"
        fill="url(#playstore_g2)"
      />
      <path
        d="M16.8557 15.5695L13.1975 11.9979L2.40161 22.5394C2.80326 22.9516 3.45825 23.0013 4.20309 22.5891L16.8557 15.5695Z"
        fill="url(#playstore_g3)"
      />
      <path
        d="M16.8557 8.42643L4.20309 1.40685C3.45825 0.998846 2.80326 1.04852 2.40161 1.46076L13.1975 11.998L16.8557 8.42643Z"
        fill="url(#playstore_g4)"
      />
      <defs>
        <linearGradient
          id="playstore_g1"
          x1="12.2445"
          y1="21.5457"
          x2="-1.94272"
          y2="7.01472"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00A0FF" />
          <stop offset="0.0066" stopColor="#00A1FF" />
          <stop offset="0.2601" stopColor="#00BEFF" />
          <stop offset="0.5122" stopColor="#00D2FF" />
          <stop offset="0.7604" stopColor="#00DFFF" />
          <stop offset="1" stopColor="#00E3FF" />
        </linearGradient>
        <linearGradient
          id="playstore_g2"
          x1="22.6677"
          y1="11.9965"
          x2="1.71087"
          y2="11.9965"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFE000" />
          <stop offset="0.4087" stopColor="#FFBD00" />
          <stop offset="0.7754" stopColor="#FFA500" />
          <stop offset="1" stopColor="#FF9C00" />
        </linearGradient>
        <linearGradient
          id="playstore_g3"
          x1="14.8664"
          y1="10.0563"
          x2="-4.37256"
          y2="-9.64893"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF3A44" />
          <stop offset="1" stopColor="#C31162" />
        </linearGradient>
        <linearGradient
          id="playstore_g4"
          x1="-0.315934"
          y1="28.7612"
          x2="8.27515"
          y2="19.962"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#32A071" />
          <stop offset="0.0685" stopColor="#2DA771" />
          <stop offset="0.4762" stopColor="#15CF74" />
          <stop offset="0.8009" stopColor="#06E775" />
          <stop offset="1" stopColor="#00F076" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function CopyIcon({ className, ...props }: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 5.5V3.5a1.5 1.5 0 00-1.5-1.5H3.5A1.5 1.5 0 002 3.5V9a1.5 1.5 0 001.5 1.5h2" />
    </svg>
  );
}

export function CheckIcon({ className, ...props }: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3.5 8.5l3 3 6-6" />
    </svg>
  );
}

export function ArrowRightIcon({ className, ...props }: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}

export function InstagramIcon({ className, ...props }: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

export function GitHubIcon({ className, ...props }: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
