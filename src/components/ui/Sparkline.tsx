import React from 'react';

interface SparklineProps {
  data: { date: string; weight_kg: number }[];
  width?: number;
  height?: number;
  stroke?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, width = 160, height = 40, stroke = '#0ea5e9' }) => {
  if (!data.length) return <div className="text-xs text-gray-400">Sem dados</div>;
  const min = Math.min(...data.map(d => d.weight_kg));
  const max = Math.max(...data.map(d => d.weight_kg));
  const span = max - min || 1;
  const points = data.map((d,i)=> {
    const x = (i/(data.length-1))*width;
    const y = height - ((d.weight_kg - min)/span)*height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={points} />
    </svg>
  );
};

export default Sparkline;