import type { ComponentProps } from 'react';
import { cn } from 'tailwind-variants';

type MoaMoneyIconVariant = 'empty' | 'animated' | 'full';

interface MoaMoneyIconProps extends Omit<ComponentProps<'svg'>, 'children'> {
  variant?: MoaMoneyIconVariant;
}

const variantColors: Record<
  MoaMoneyIconVariant,
  { fill: string; stroke: string; detail: string }
> = {
  empty: {
    fill: '#484A4D',
    stroke: '#343639',
    detail: '#343639',
  },
  animated: {
    fill: '#1FD683',
    stroke: '#17A968',
    detail: '#0F7449',
  },
  full: {
    fill: '#1FD683',
    stroke: '#17A968',
    detail: '#0F7449',
  },
};

export function MoaMoneyIcon({
  variant = 'empty',
  className,
  ...props
}: MoaMoneyIconProps) {
  const colors = variantColors[variant];
  const isAnimated = variant === 'animated';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-20', className)}
      viewBox="0 0 80 80"
      fill="none"
      {...props}
    >
      {isAnimated && (
        <>
          <circle
            cx="40.6274"
            cy="39.2898"
            r="36.7349"
            fill={variantColors.empty.fill}
            stroke={variantColors.empty.stroke}
            strokeWidth="6.46465"
          />
          <path
            d="M24.2905 23.6533H31.7719L40.4541 46.3344H40.7997L49.4819 23.6533H56.9633L58.622 54.9266H52.5236L51.2097 34.4521H50.9505L42.7867 54.9266H38.4672L30.3033 34.3657H30.0441L28.9383 54.9266H22.6318L24.2905 23.6533Z"
            fill={variantColors.empty.detail}
          />
          <rect
            x="19.6167"
            y="38.2783"
            width="42.0202"
            height="4.42318"
            fill={variantColors.empty.detail}
          />
        </>
      )}
      <g
        className={
          isAnimated ? 'animate-[fill-up_4s_ease-out_infinite]' : undefined
        }
      >
        <circle
          cx="40.6274"
          cy="39.2898"
          r="36.7349"
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth="6.46465"
        />
        <path
          d="M24.2905 23.6533H31.7719L40.4541 46.3344H40.7997L49.4819 23.6533H56.9633L58.622 54.9266H52.5236L51.2097 34.4521H50.9505L42.7867 54.9266H38.4672L30.3033 34.3657H30.0441L28.9383 54.9266H22.6318L24.2905 23.6533Z"
          fill={colors.detail}
        />
        <rect
          x="19.6167"
          y="38.2783"
          width="42.0202"
          height="4.42318"
          fill={colors.detail}
        />
      </g>
    </svg>
  );
}
