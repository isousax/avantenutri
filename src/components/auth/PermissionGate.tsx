import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface Props {
  anyOf?: string[];
  allOf?: string[];
  not?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

const PermissionGate: React.FC<Props> = ({ anyOf, allOf, not, children, fallback=null, loadingFallback=null }) => {
  const { loading, capabilities } = usePermissions();
  if (loading) return <>{loadingFallback}</>;
  const caps = new Set(capabilities);
  if (anyOf && !anyOf.some(c => caps.has(c))) return <>{fallback}</>;
  if (allOf && !allOf.every(c => caps.has(c))) return <>{fallback}</>;
  if (not && not.some(c => caps.has(c))) return <>{fallback}</>;
  return <>{children}</>;
};

export default PermissionGate;
