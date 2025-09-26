import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts';

interface EntitlementsResponse { capabilities: string[]; limits: Record<string, number|null>; hash?: string|null; version?: number|null }

export function usePermissions() {
  const { authenticatedFetch } = useAuth();
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [limits, setLimits] = useState<Record<string, number|null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(()=>{
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const r = await authenticatedFetch('/api/auth/entitlements', { method: 'GET', autoLogout: true });
        if (!r.ok) throw new Error('Falha ao carregar entitlements');
        const data: EntitlementsResponse = await r.json();
        if (!cancelled) {
          setCapabilities(data.capabilities || []);
          setLimits(data.limits || {});
        }
      } catch (e:any) {
        if (!cancelled) setError(e.message || 'Erro');
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [authenticatedFetch]);

  const can = useCallback((code: string) => capabilities.includes(code), [capabilities]);
  const any = useCallback((codes: string[]) => codes.some(c => capabilities.includes(c)), [capabilities]);
  const all = useCallback((codes: string[]) => codes.every(c => capabilities.includes(c)), [capabilities]);

  return { capabilities, limits, loading, error, can, any, all };
}
