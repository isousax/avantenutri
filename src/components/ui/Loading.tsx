import React, { useState } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variantClasses = {
    default: 'border-gray-300 border-t-gray-600',
    primary: 'border-blue-200 border-t-blue-600',
    success: 'border-green-200 border-t-green-600',
    warning: 'border-amber-200 border-t-amber-600',
    error: 'border-red-200 border-t-red-600'
  };

  return (
    <div 
      className={`animate-spin rounded-full border-2 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} 
    />
  );
};

// Interface para o componente de erro
interface ErrorDisplayProps {
  error?: Error | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'full';
  actionLabel?: string;
}

// Componente de erro principal
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title = "Algo deu errado",
  message = "Ocorreu um erro inesperado. Tente novamente.",
  onRetry,
  onDismiss,
  showDetails = false,
  className = '',
  variant = 'default',
  actionLabel = "Tentar Novamente"
}) => {
  const [showErrorDetails, setShowErrorDetails] = useState(showDetails);

  const getErrorIcon = () => {
    return (
      <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
    );
  };

  const getNetworkErrorIcon = () => {
    return (
      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      </div>
    );
  };

  const getServerErrorIcon = () => {
    return (
      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      </div>
    );
  };

  // Detectar tipo de erro baseado na mensagem ou propriedades
  const getErrorType = () => {
    if (!error) return 'generic';
    
    const message = error.message?.toLowerCase() || '';
    if (message.includes('network') || message.includes('fetch') || message.includes('internet')) {
      return 'network';
    }
    if (message.includes('server') || message.includes('500') || message.includes('503')) {
      return 'server';
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'timeout';
    }
    return 'generic';
  };

  const errorType = getErrorType();
  
  const errorIcons = {
    generic: getErrorIcon(),
    network: getNetworkErrorIcon(),
    server: getServerErrorIcon(),
    timeout: getErrorIcon() // Usar ícone padrão para timeout
  };

  const errorMessages = {
    generic: {
      title: "Algo deu errado",
      message: "Ocorreu um erro inesperado. Tente novamente."
    },
    network: {
      title: "Problema de conexão",
      message: "Verifique sua conexão com a internet e tente novamente."
    },
    server: {
      title: "Serviço indisponível",
      message: "Estamos enfrentando problemas técnicos. Tente novamente em alguns instantes."
    },
    timeout: {
      title: "Tempo esgotado",
      message: "A operação demorou muito para responder. Tente novamente."
    }
  };

  const { title: errorTitle, message: errorMessage } = errorMessages[errorType];

  // Variante compacta (para inline errors)
  if (variant === 'compact') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 mt-0.5">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-red-800">{title || errorTitle}</h3>
            <p className="text-sm text-red-700 mt-1">{message || errorMessage}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
              >
                {actionLabel}
              </button>
            )}
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Variante completa (para páginas de erro)
  if (variant === 'full') {
    return (
      <div className={`min-h-[400px] flex items-center justify-center p-8 ${className}`}>
        <div className="text-center max-w-md">
          {errorIcons[errorType]}
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {title || errorTitle}
          </h2>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            {message || errorMessage}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 transition-all duration-300 transform hover:scale-105"
              >
                {actionLabel}
              </button>
            )}
            
            <button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className="px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-xl transition-colors"
            >
              {showErrorDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
            </button>
          </div>

          {showErrorDetails && error && (
            <div className="mt-6 p-4 bg-gray-900 rounded-xl text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Detalhes do Erro:</span>
                <button
                  onClick={() => navigator.clipboard.writeText(error.stack || error.message)}
                  className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Copiar
                </button>
              </div>
              <pre className="text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap">
                {error.stack || error.message}
              </pre>
            </div>
          )}

          <div className="mt-8 text-xs text-gray-500">
            <p>Se o problema persistir, entre em contato com o suporte.</p>
          </div>
        </div>
      </div>
    );
  }

  // Variante padrão (para cards de erro)
  return (
    <div className={`bg-red-50 border border-red-200 rounded-2xl p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            {title || errorTitle}
          </h3>
          
          <p className="text-red-700 mb-4">
            {message || errorMessage}
          </p>

          <div className="flex flex-wrap gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                {actionLabel}
              </button>
            )}
            
            <button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className="px-4 py-2 text-red-700 hover:text-red-800 font-medium rounded-lg transition-colors"
            >
              {showErrorDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
            </button>
          </div>

          {showErrorDetails && error && (
            <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-200">
              <pre className="text-xs text-red-800 overflow-x-auto whitespace-pre-wrap">
                {error.stack || error.message}
              </pre>
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
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
  onRetry?: () => void;
  loadingVariant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  errorVariant?: 'default' | 'compact' | 'full';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  error,
  children,
  loadingComponent,
  errorComponent,
  onRetry,
  loadingVariant = 'default',
  errorVariant = 'default'
}) => {
  if (error) {
    return (
      errorComponent || (
        <ErrorDisplay 
          error={error} 
          onRetry={onRetry}
          variant={errorVariant}
        />
      )
    );
  }

  if (isLoading) {
    return (
      <div>
        {loadingComponent || <LoadingSpinner variant={loadingVariant} />}
      </div>
    );
  }

  return <>{children}</>;
};

// Skeleton components melhorados
export const SkeletonLine: React.FC<{ 
  className?: string;
  animated?: boolean;
}> = ({ className = '', animated = true }) => (
  <div 
    className={`bg-gray-200 rounded-md h-4 ${animated ? 'animate-pulse' : ''} ${className}`} 
  />
);

export const SkeletonCard: React.FC<{ 
  lines?: number; 
  className?: string;
  animated?: boolean;
}> = ({ 
  lines = 3, 
  className = '',
  animated = true
}) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine 
          key={i} 
          animated={animated}
          className={i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-1/2' : 'w-full'} 
        />
      ))}
    </div>
  </div>
);

// Componente de placeholder para empty states
export const EmptyState: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ 
  title, 
  description, 
  icon = "📝",
  action,
  className = '' 
}) => (
  <div className={`text-center py-12 px-4 ${className}`}>
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    {description && (
      <p className="text-gray-600 max-w-md mx-auto mb-6">{description}</p>
    )}
    {action && (
      <div className="mt-4">
        {action}
      </div>
    )}
  </div>
);

// Hook para gerenciar estados de loading e erro
export const useAsyncState = <T,>() => {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = async (asyncFunction: () => Promise<T>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setIsLoading(false);
    setError(null);
  };

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
    setData,
    setError
  };
};