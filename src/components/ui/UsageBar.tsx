import React from 'react';
import { useI18n } from '../../i18n';

interface UsageBarProps {
  value: number | null | undefined;
  limit: number | null | undefined; // null => ilimitado
  className?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean; // mostra números
  title?: string; // tooltip opcional
  labels?: {
    exceeded?: string;
    high?: string;
    infinite?: string;
    formatPercent?: (p:number) => string;
  }
}

/**
 * Componente reutilizável para exibir uso vs limite.
 * - Cores: <70% amber-500, 70-89% orange-500, >=90% red-500
 * - Limite null => ilimitado (não exibe barra cheia, só valor)
 * - Limite 0 e uso >0 => estado excedido (barra 100% vermelha)
 */
export const UsageBar: React.FC<UsageBarProps> = ({ value, limit, className='', size='sm', showLabel=true, title, labels }) => {
  const { t } = useI18n();
  const v = typeof value === 'number' ? value : 0;
  const l = (typeof limit === 'number') ? limit : null;
  let percent: number | null = null;
  let critical = false;
  let exceeded = false;

  if (l === 0) {
    if (v > 0) { percent = 100; exceeded = true; }
    else { percent = 0; }
  } else if (l && l > 0) {
    percent = Math.min(100, Math.round((v / l) * 100));
    if (percent >= 90) critical = true;
  }

  let barColor = 'bg-amber-500';
  if (percent !== null) {
    if (percent >= 90) barColor = 'bg-red-500';
    else if (percent >= 70) barColor = 'bg-orange-500';
  }
  if (exceeded) barColor = 'bg-red-600';

  const height = size === 'sm' ? 'h-2' : 'h-3';
  const labelCls = 'flex justify-between text-[10px] tabular-nums mt-0.5';

  return (
    <div className={`flex flex-col ${className}`} title={title} aria-label={title}>
      {percent !== null && (
        <div className={`w-full rounded bg-amber-200 overflow-hidden ${height}`}>
          <div
            className={`h-full transition-all duration-300 ${barColor}`}
            style={{ width: percent + '%' }}
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
      )}
      {l === null && (
        <div className={`w-full rounded bg-amber-100 border border-dashed border-amber-300 ${height} flex items-center justify-center text-[9px] text-amber-600`}>{labels?.infinite || t('usageBar.infinite')}</div>
      )}
      {showLabel && (
        <div className={labelCls}>
          <span>{v}</span>
          <span>{l === null ? (labels?.infinite || t('usageBar.infinite')) : l === 0 ? (v>0? '0!' : '0') : (percent == null ? '—' : labels?.formatPercent ? labels.formatPercent(percent) : t('usageBar.percent', { percent }))}</span>
        </div>
      )}
      {exceeded && <span className="text-[9px] text-red-600 font-medium">{labels?.exceeded || t('usageBar.state.exceeded')}</span>}
      {critical && !exceeded && <span className="text-[9px] text-red-500">{labels?.high || t('usageBar.state.high')}</span>}
    </div>
  );
};

export default UsageBar;
