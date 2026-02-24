import { cn } from 'tailwind-variants';

export function AppFooter({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-9 flex flex-col items-center justify-center gap-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
