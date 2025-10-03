import React from 'react';
import { LoadingSpinner } from './Loading';

interface RouteFallbackProps {
  label?: string;
  description?: string;
  className?: string;
  spinnerSize?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  progress?: number;
}

/**
 * Enhanced accessible fallback for lazy loaded routes.
 * - Occupies full viewport height
 * - Perfectly centered content
 * - Smooth animations
 */
const RouteFallback: React.FC<RouteFallbackProps> = ({
  label = 'Carregando...',
  description,
  className = '',
  spinnerSize = 'lg',
  showProgress = false,
  progress = 0
}) => {
  const progressPercentage = Math.min(Math.max(progress, 0), 100);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      aria-describedby={description ? 'fallback-description' : undefined}
      className={`
        fixed inset-0 z-50
        flex flex-col items-center justify-center
        bg-white/80 backdrop-blur-sm
        py-16 gap-4 text-gray-600
        animate-fade-in
        ${className}
      `}
    >
      {/* Loading content */}
      <div className="flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
        {/* Loading spinner */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gray-100/50 animate-pulse" />
          <LoadingSpinner size={spinnerSize} variant="primary" />
        </div>

        {/* Text content */}
        <div className="flex flex-col items-center gap-2">
          <div 
            className="text-sm font-medium transition-all duration-300"
            data-testid="route-fallback-label"
          >
            {label}
          </div>
          
          {description && (
            <p 
              id="fallback-description"
              className="text-xs text-gray-500 leading-relaxed"
            >
              {description}
            </p>
          )}
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="w-48 mt-2 bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}
      </div>

      {/* Accessibility announcement */}
      <div 
        aria-live="assertive" 
        className="sr-only"
      >
        {progressPercentage > 0 ? `Carregamento ${progressPercentage}% completo` : 'Carregando'}
      </div>
    </div>
  );
};

export default RouteFallback;