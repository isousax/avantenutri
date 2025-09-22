import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max }) => {
  const percent = Math.round((value / max) * 100);
  return (
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div
        className="bg-green-500 h-3 rounded-full transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

export default ProgressBar;
