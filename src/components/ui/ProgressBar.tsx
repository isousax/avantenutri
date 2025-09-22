import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  labels?: string[];
  currentStep: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, labels, currentStep }) => {
  const percent = Math.round((value / max) * 100);
  
  return (
    <div className="w-full">
      {/* Barra de progresso */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      
      {/* Labels das etapas */}
      {labels && (
        <div className="flex justify-between relative">
          {labels.map((label, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-2 transition-all duration-300 ${
                index <= currentStep 
                  ? 'bg-green-500 text-white shadow-md transform scale-110' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {index + 1}
              </div>
              <span className={`text-[11px] sm:text-xs font-medium text-center max-w-20 ${
                index <= currentStep ? 'text-green-700' : 'text-gray-500'
              }`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;