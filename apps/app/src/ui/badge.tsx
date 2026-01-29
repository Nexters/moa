import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cn, tv, type VariantProps } from 'tailwind-variants';

export const badgeVariants = tv({
  base: [
    'group/badge b2-500 inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border border-transparent px-2.5 py-0.5 whitespace-nowrap transition-all',
    '[&>svg]:pointer-events-none [&>svg]:size-3!',
    'has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5',
    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[.1875rem]',
  ],
  variants: {
    variant: {
      green: 'bg-green-70 text-green-40',
      blue: 'text-blue-light bg-[#348CFF47]',
      pink: 'bg-pink text-pink-light',
      yellow: 'bg-yellow text-yellow-light',
    },
  },
  defaultVariants: {
    variant: 'green',
  },
});

export function Badge({
  className,
  variant = 'green',
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ className, variant })),
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  });
}
