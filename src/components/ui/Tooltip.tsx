import React, { useState, useId } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
  delayMs?: number;
  className?: string;
}

// Pequeno tooltip leve sem dependências externas.
const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'top', delayMs = 150, className }) => {
  const [visible, setVisible] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const id = useId();

  const show = () => {
    if (timer) window.clearTimeout(timer);
    const t = window.setTimeout(() => setVisible(true), delayMs) as unknown as number;
    setTimer(t);
  };
  const hide = () => {
    if (timer) window.clearTimeout(timer);
    setTimer(null);
    setVisible(false);
  };

  return (
    <span
      className={`relative inline-flex items-center group ${className || ''}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {/* Elemento foco/hover */}
      <span aria-describedby={visible ? id : undefined} tabIndex={0} className="outline-none focus:ring-2 focus:ring-purple-400 rounded-sm">
        {children}
      </span>
      {/* Bubble */}
      {visible && (
        <div
          id={id}
          role="tooltip"
          className={`pointer-events-none select-none absolute z-50 px-2 py-1 text-[11px] font-medium rounded-md shadow-lg bg-gray-900 text-gray-100 whitespace-nowrap border border-gray-700 ${
            side === 'top'
              ? 'bottom-full left-1/2 -translate-x-1/2 mb-2 animate-tooltip-in'
              : 'top-full left-1/2 -translate-x-1/2 mt-2 animate-tooltip-in-bottom'
          }`}
        >
          {content}
          <span
            className={`absolute w-2 h-2 rotate-45 bg-gray-900 border border-gray-700 border-t-transparent border-l-transparent ${
              side === 'top'
                ? 'top-full left-1/2 -translate-x-1/2'
                : 'bottom-full left-1/2 -translate-x-1/2'
            }`}
          />
        </div>
      )}
    </span>
  );
};

export default Tooltip;

// Pequena animação (opcional) – poderia ir em CSS global se preferir
// tailwind não inclui por padrão; se não quiser inline, mover para stylesheet
// Ex: @keyframes fade-in { from { opacity:0; transform:translateY(2px)} to { opacity:1; transform:translateY(0)} }