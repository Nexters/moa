import type { ReactNode } from 'react';
import { cn } from 'tailwind-variants';

interface Props {
  title: string;
  children?: ReactNode;
  className?: string;
}

export function SettingsSection({ title, children, className }: Props) {
  return (
    <section className={cn('flex flex-col gap-2', className)}>
      <h2 className="b2-500 text-text-medium">{title}</h2>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}
