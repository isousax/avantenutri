import React from "react";

interface SparklineProps {
  data: { date: string; weight_kg: number }[];
  width?: number;
  height?: number;
  stroke?: string;
  gradient?: string[];
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 160,
  height = 40,
  stroke = "#0ea5e9",
  gradient,
}) => {
  if (!data.length)
    return <div className="text-xs text-gray-400">Sem dados</div>;

  const min = Math.min(...data.map((d) => d.weight_kg));
  const max = Math.max(...data.map((d) => d.weight_kg));
  const span = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d.weight_kg - min) / span) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const gradientId = `sparkline-gradient-${Math.random()
    .toString(36)
    .substring(2, 9)}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="overflow-visible"
    >
      {gradient && gradient.length > 1 && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            {gradient.map((color, index) => (
              <stop
                key={index}
                offset={`${(index / (gradient.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>
        </defs>
      )}
      <polyline
        fill="none"
        stroke={
          gradient && gradient.length > 1 ? `url(#${gradientId})` : stroke
        }
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
};

export default Sparkline;
