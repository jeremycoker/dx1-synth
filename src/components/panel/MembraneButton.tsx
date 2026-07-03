/** Tactile membrane button with optional status LED, DX1 style. */

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  led?: boolean; // show a status LED above the label
  blue?: boolean;
  className?: string;
  title?: string;
}

export function MembraneButton({ children, onClick, active, led, blue, className = '', title }: Props) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`dx-btn ${blue ? 'dx-btn-blue' : ''} ${active && !led ? 'dx-btn-active' : ''}
        px-2 py-1 text-[10px] font-panel uppercase tracking-wide flex flex-col items-center gap-1 ${className}`}
    >
      {led && <span className={`dx-dot-led ${active ? 'on' : ''}`} />}
      <span>{children}</span>
    </button>
  );
}
