import React from 'react';

interface MiniSparklineProps { values: number[]; width?: number; height?: number; stroke?: string; }

const MiniSparkline: React.FC<MiniSparklineProps> = ({ values, width=120, height=30, stroke='#0ea5e9' }) => {
  if (!values.length) return <div className="text-xs text-slate-400">-</div>;
  const min = Math.min(...values); const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v,i)=> {
    const x = (i/(values.length-1))* (width-4) + 2;
    const y = height - ((v - min)/span) * (height-4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const trend = values[values.length-1] - values[0];
  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <polyline points={pts} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span className={`text-[10px] ${trend>=0 ? 'text-emerald-600' : 'text-rose-600'}`}>{trend>=0?'+':''}{trend.toFixed(0)}</span>
    </div>
  );
};

export default MiniSparkline;