import React from 'react';
import { LoadingSpinner } from './Loading';

/**
 * Accessible fallback for lazy loaded routes.
 * - Announces loading state to screen readers
 * - Centers spinner
 * - Minimizes layout shift using min-height
 */
const RouteFallback: React.FC<{ label?: string; description?: string }>= ({ label = 'Carregando...', description }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col items-center justify-center py-16 gap-4 text-gray-600 min-h-[200px]"
    >
      <LoadingSpinner size="lg" variant="primary" />
      <div className="text-sm font-medium" data-testid="route-fallback-label">{label}</div>
      {description && <p className="text-xs text-gray-400 max-w-sm text-center">{description}</p>}
    </div>
  );
};

export default RouteFallback;
