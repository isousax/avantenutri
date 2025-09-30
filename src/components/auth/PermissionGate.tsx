import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface Props {
  anyOf?: string[];
  allOf?: string[];
  not?: string[];
  fallback?: React.ReactNode;            // Renderizado quando realmente não tem permissão
  children: React.ReactNode;             // Conteúdo autorizado
  loadingFallback?: React.ReactNode;     // Primeiro carregamento (sem dados ainda)
  reloadingFallback?: React.ReactNode;   // Atualizando permissões (já tinha dados antes)
  hideOnReload?: boolean;                // Se true, esconde children durante reloading
}

const DefaultSpinner = () => (
  <div className="inline-flex items-center gap-2 text-xs text-gray-500 animate-pulse">
    <span className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-transparent animate-spin"></span>
    Carregando...
  </div>
);

const PermissionGate: React.FC<Props> = ({ anyOf, allOf, not, children, fallback=null, loadingFallback=null, reloadingFallback=null, hideOnReload=false }) => {
  const { loading, reloading, capabilities, ready } = usePermissions() as any;
  // Primeiro load (sem dados ainda)
  if (loading && !ready) return <>{loadingFallback || <DefaultSpinner />}</>;

  const caps = new Set(capabilities);
  const lacksAny = anyOf && !anyOf.some(c => caps.has(c));
  const lacksAll = allOf && !allOf.every(c => caps.has(c));
  const hasNotConflict = not && not.some(c => caps.has(c));

  const noAccess = (lacksAny || lacksAll || hasNotConflict);

  // Durante reloading não mostramos "sem acesso" para evitar flicker; mantemos conteúdo ou spinner leve
  if (reloading) {
    if (noAccess) {
      return <>{reloadingFallback || (hideOnReload ? <DefaultSpinner /> : children)}</>;
    }
    return hideOnReload ? <>{reloadingFallback || <DefaultSpinner />}</> : <>{children}</>;
  }

  if (noAccess) return <>{fallback}</>;
  return <>{children}</>;
};

export default PermissionGate;
