import type { ComponentProps } from 'react';

import { cn } from '@moa/shared';

type MoaMoneyIconVariant = 'default' | 'active';

interface MoaMoneyIconProps extends Omit<ComponentProps<'svg'>, 'children'> {
  variant?: MoaMoneyIconVariant;
}

const variantColors: Record<
  MoaMoneyIconVariant,
  { fill: string; stroke: string; detail: string }
> = {
  default: {
    fill: '#484A4D',
    stroke: '#343639',
    detail: '#343639',
  },
  active: {
    fill: '#48B477',
    stroke: '#3D9A65',
    detail: '#3D9A65',
  },
};

export function MoaMoneyIcon({
  variant = 'default',
  className,
  ...props
}: MoaMoneyIconProps) {
  const colors = variantColors[variant];

  return (
    <svg
      className={cn('size-20', className)}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle
        cx="39.9673"
        cy="39.9673"
        r="36.7349"
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="6.46465"
      />
      <path
        d="M23.6309 24.3306H31.1123L39.7945 47.0117H40.14L48.8222 24.3306H56.3036L57.9623 55.6038H51.8639L50.55 35.1293H50.2909L42.127 55.6038H37.8075L29.6436 35.043H29.3844L28.2787 55.6038H21.9722L23.6309 24.3306Z"
        fill={colors.detail}
      />
      <rect
        x="18.957"
        y="38.9558"
        width="42.0202"
        height="4.42318"
        fill={colors.detail}
      />
    </svg>
  );
}
