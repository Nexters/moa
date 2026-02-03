import type { ComponentProps } from 'react';
import { cn } from 'tailwind-variants';

interface MoaLogoIconProps extends Omit<ComponentProps<'svg'>, 'children'> {}

export function MoaLogoIcon({ className, ...props }: MoaLogoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-[16.18px] w-[52px]', className)}
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
