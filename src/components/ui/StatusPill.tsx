import React from 'react';

interface StatusPillProps {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  icon?: React.ReactNode; // opcional ícone à esquerda
  bordered?: boolean; // permitir remover borda se necessário
  subtle?: boolean; // variante mais suave (reduz intensidade de fundo)
}

const toneStyles: Record<Required<StatusPillProps>['tone'], { bg: string; text: string; border: string }> = {
  neutral: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  success: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  danger: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

export const StatusPill: React.FC<StatusPillProps> = ({ label, tone = 'neutral', className = '', icon, bordered = true, subtle = false }) => {
  const t = toneStyles[tone];
  const bg = subtle ? t.bg.replace('50','25') : t.bg; // tentativa simples de suavizar
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${bordered ? 'border '+t.border : ''} ${bg} ${t.text} ${className}`}>
      {icon && <span className="flex items-center justify-center">{icon}</span>}
      {label}
    </span>
  );
};

// Helper genérico para converter um rótulo de status textual em um 'tone' padronizado.
// Implementa heurística simples baseada em fragmentos em pt/en.
export function getStatusTone(label: string): StatusPillProps['tone'] {
  const l = label.toLowerCase();
  if (/pago|paid|successo|sucesso|conclu/i.test(l)) return 'success';
  if (/pend|aguard|pending|em analise|análise/i.test(l)) return 'warning';
  if (/falh|erro|error|cancel|negad|denied/i.test(l)) return 'danger';
  if (/agend|schedul|em curso|andamento|ativo|active/i.test(l)) return 'info';
  return 'neutral';
}

export default StatusPill;
