import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../contexts";
import { API } from "../config/api";

interface EntitlementsResponse {
  capabilities: string[];
  limits: Record<string, number | null>;
  hash?: string | null;
  version?: number | null;
  usage?: Record<string, any>;
}

export function usePermissions() {
  const { authenticatedFetch } = useAuth();
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [limits, setLimits] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<Record<string, any>>({});
  // Usar refs para valores que não precisam disparar re-render nem recriar callbacks
  const etagRef = useRef<string | null>(null);
  const capsHashRef = useRef<string | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const attemptRef = useRef(0);
  const [attempt, setAttempt] = useState(0); // ainda exposto para debug/UI

  // Evita loop: loadMounted garante que só chamamos auto-load uma vez
  const initialLoadDoneRef = useRef(false);

  const load = useCallback(async (force = false, forcedAttempt?: number) => {
    // Cancelar retry pendente
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    const currentAttempt = forcedAttempt ?? 0;
    if (currentAttempt === 0) {
      attemptRef.current = 0;
      setAttempt(0);
    }
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string,string> = {};
      if (etagRef.current && !force) headers['If-None-Match'] = etagRef.current;
      const r = await authenticatedFetch(API.ENTITLEMENTS, { method: 'GET', autoLogout: true, headers });
      if (r.status === 304) { setLoading(false); return; }
      if (!r.ok) throw new Error('Falha ao carregar entitlements');
      const newEtag = r.headers.get('ETag'); if (newEtag) etagRef.current = newEtag;
      const data: EntitlementsResponse = await r.json();
      const newCaps = data.capabilities || [];
      const newHash = newCaps.slice().sort().join('|');
      if (capsHashRef.current && capsHashRef.current !== newHash) {
        window.dispatchEvent(new CustomEvent('entitlements:changed', { detail: { previous: capsHashRef.current, current: newHash } }));
      }
      capsHashRef.current = newHash;
      setCapabilities(newCaps);
      setLimits(data.limits || {});
      setUsage(data.usage || {});
      attemptRef.current = 0;
      setAttempt(0);
    } catch (e:any) {
      setError(e.message || 'Erro');
      const next = currentAttempt + 1;
      attemptRef.current = next;
      setAttempt(next);
      if (next <= 6) { // até ~32s
        // Exponential backoff com jitter
        const base = 500;
        const max = 30000;
        const exp = Math.min(max, base * Math.pow(2, next));
        const delay = Math.floor(Math.random() * exp);
        retryTimerRef.current = window.setTimeout(() => load(false, next), delay);
      }
    } finally { setLoading(false); }
  }, [authenticatedFetch]);

  // Carrega apenas uma vez no mount (evita loop devido a mudanças de estado internas)
  useEffect(() => {
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      load();
    }
  }, [load]);

  useEffect(() => {
    const handler = () => load(true);
    const invalidateHandler = () => load(true);
    window.addEventListener('entitlements:refresh', handler as any);
    window.addEventListener('entitlements:invalidate', invalidateHandler as any);
    return () => {
      window.removeEventListener('entitlements:refresh', handler as any);
      window.removeEventListener('entitlements:invalidate', invalidateHandler as any);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [load]);

  const can = useCallback(
    (code: string) => capabilities.includes(code),
    [capabilities]
  );
  const any = useCallback(
    (codes: string[]) => codes.some((c) => capabilities.includes(c)),
    [capabilities]
  );
  const all = useCallback(
    (codes: string[]) => codes.every((c) => capabilities.includes(c)),
    [capabilities]
  );

  return { capabilities, limits, usage, loading, error, can, any, all, reload: () => load(true), attempt };
}
