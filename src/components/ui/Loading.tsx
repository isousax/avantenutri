import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
};

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  title = "Carregando...", 
  description,
  className = '',
  children
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-center flex-col space-y-4">
        <LoadingSpinner size="lg" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

interface LoadingStateProps {
  isLoading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  error,
  children,
  loadingComponent,
  errorComponent
}) => {
  if (error) {
    return (
      errorComponent || (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Erro ao carregar dados
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {error.message || 'Algo deu errado. Tente novamente.'}
              </p>
            </div>
          </div>
        </div>
      )
    );
  }

  if (isLoading) {
    return (
      <div>
        {loadingComponent || <LoadingSpinner />}
      </div>
    );
  }

  return <>{children}</>;
};

// Skeleton components para melhor UX
export const SkeletonLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-md h-4 ${className}`} />
);

export const SkeletonCard: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className = '' 
}) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine 
          key={i} 
          className={i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-1/2' : 'w-full'} 
        />
      ))}
    </div>
  </div>
);