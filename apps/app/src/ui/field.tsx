import { Field as BaseField } from '@base-ui/react/field';
import { cn } from 'tailwind-variants';

function Root({
  className,
  ...props
}: React.ComponentProps<typeof BaseField.Root>) {
  return (
    <BaseField.Root
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

function Label({
  className,
  ...props
}: React.ComponentProps<typeof BaseField.Label>) {
  return (
    <BaseField.Label
      className={cn('b2-500 text-text-medium', className)}
      {...props}
    />
  );
}

function Error({
  className,
  ...props
}: React.ComponentProps<typeof BaseField.Error>) {
  return (
    <BaseField.Error
      className={cn('b3-400 text-error', className)}
      {...props}
    />
  );
}

export const Field = { Root, Label, Error };
