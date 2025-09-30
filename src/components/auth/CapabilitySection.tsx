import React from 'react';
import PermissionGate from './PermissionGate';

interface CapabilitySectionProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  anyOf?: string[];
  allOf?: string[];
  not?: string[];
  className?: string;
  loadingFallback?: React.ReactNode;
  reloadingFallback?: React.ReactNode;
  fallback?: React.ReactNode;
  hideOnReload?: boolean;
  children: React.ReactNode;
  toolbar?: React.ReactNode; // botão "Ver todas", etc.
}

// Pequeno wrapper padrão para padronizar seções condicionais por capability
const CapabilitySection: React.FC<CapabilitySectionProps> = ({
  title,
  description,
  anyOf,
  allOf,
  not,
  className='',
  loadingFallback,
  reloadingFallback,
  fallback=<div className="text-sm text-gray-500">Sem acesso a este recurso.</div>,
  hideOnReload=false,
  children,
  toolbar,
}) => {
  return (
    <div className={"p-6 bg-white rounded-xl shadow-sm border border-gray-100 " + className}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>}
        </div>
        {toolbar && <div className="shrink-0">{toolbar}</div>}
      </div>
      <PermissionGate
        anyOf={anyOf}
        allOf={allOf}
        not={not}
        loadingFallback={loadingFallback}
        reloadingFallback={reloadingFallback}
        fallback={fallback}
        hideOnReload={hideOnReload}
      >
        {children}
      </PermissionGate>
    </div>
  );
};

export default CapabilitySection;