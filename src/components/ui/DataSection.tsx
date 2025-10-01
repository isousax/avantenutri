import React from 'react';
import { LoadingState, SkeletonCard } from './Loading';

interface DataSectionProps {
  title?: string;
  isLoading: boolean;
  error?: Error | string | null;
  skeletonLines?: number;
  skeletonClassName?: string;
  children: React.ReactNode;
  showWrapper?: boolean; // se quiser envolver em div padrão
  className?: string;
  loadingGuardValues?: any[]; // valores para shouldShowSkeleton (delegado fora)
  customSkeleton?: React.ReactNode;
}

/**
 * Abstração leve para padronizar bloco de dados com LoadingState + SkeletonCard.
 * Não impõe layout; apenas centraliza padrão de propriedades.
 */
export const DataSection: React.FC<DataSectionProps> = ({
  title,
  isLoading,
  error,
  skeletonLines = 3,
  skeletonClassName = 'h-32',
  children,
  showWrapper = false,
  className = '',
  customSkeleton,
}) => {
  const content = (
    <LoadingState
      isLoading={isLoading}
      error={typeof error === 'string' ? new Error(error) : error || null}
      loadingComponent={customSkeleton || <SkeletonCard lines={skeletonLines} className={skeletonClassName} />}
    >
      {children}
    </LoadingState>
  );
  if (!showWrapper) return content;
  return (
    <div className={className}>
      {title && <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>}
      {content}
    </div>
  );
};

export default DataSection;
