import type { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

export function SettingsSection({ title, children }: Props) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="c1-500 text-text-low px-1">{title}</h2>
      <div className="bg-container-primary flex flex-col rounded-md">
        {children}
      </div>
    </section>
  );
}
