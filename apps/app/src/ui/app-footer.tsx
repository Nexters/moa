import { cn } from 'tailwind-variants';

export function AppFooter({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'absolute inset-x-0 bottom-6 flex flex-col items-center justify-center gap-3 px-8',
        className,
      )}
    >
      {children}
    </div>
  );
}
