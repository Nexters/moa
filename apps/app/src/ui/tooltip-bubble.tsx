import type { ReactNode } from 'react';

interface TooltipBubbleProps {
  children: ReactNode;
}

export function TooltipBubble({ children }: TooltipBubbleProps) {
  return (
    <div className="relative flex flex-col items-center">
      <div className="bg-container-secondary rounded-xl px-5 py-2">
        <p className="b2-400 text-text-high text-center">{children}</p>
      </div>
      <svg
        className="text-container-secondary"
        width="20"
        height="12"
        viewBox="0 0 20 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M10 12L0 0H20L10 12Z" fill="currentColor" />
      </svg>
    </div>
  );
}
