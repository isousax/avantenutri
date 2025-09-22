import React from 'react';

interface ProgressProps {
  current: number;
  target: number;
  label: string;
  unit?: string;
}

const Progress: React.FC<ProgressProps> = ({ current, target, label, unit = '' }) => {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-500">
          {current}{unit} / {target}{unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-brand-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        >
          <span className="sr-only">{percentage}% Completo</span>
        </div>
      </div>
    </div>
  );
};

export default Progress;