import { useEffect, useState, useCallback } from "react";
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
  const [etag, setEtag] = useState<string | null>(null);
  const [capsHash, setCapsHash] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [retryTimer, setRetryTimer] = useState<number | null>(null);

  const scheduleRetry = useCallback((nextAttempt: number) => {
    // Exponential backoff with full jitter: base 500ms * 2^attempt (cap 30s)
    const base = 500;
    const max = 30000;
    const exp = Math.min(max, base * Math.pow(2, nextAttempt));
    const delay = Math.floor(Math.random() * exp); // full jitter
    const id = window.setTimeout(() => load(false, nextAttempt), delay);
    setRetryTimer(id);
  }, []);

  const load = useCallback(async (force = false, forcedAttempt?: number) => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      setRetryTimer(null);
    }
    const currentAttempt = forcedAttempt ?? 0;
    if (currentAttempt === 0) setAttempt(0);
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string,string> = {};
      if (etag && !force) headers['If-None-Match'] = etag;
      const r = await authenticatedFetch(API.ENTITLEMENTS, { method: 'GET', autoLogout: true, headers });
      if (r.status === 304) { setLoading(false); return; }
      if (!r.ok) throw new Error('Falha ao carregar entitlements');
      const newEtag = r.headers.get('ETag'); if (newEtag) setEtag(newEtag);
      const data: EntitlementsResponse = await r.json();
      const newCaps = data.capabilities || [];
      const newHash = newCaps.slice().sort().join('|');
      if (capsHash && capsHash !== newHash) {
        window.dispatchEvent(new CustomEvent('entitlements:changed', { detail: { previous: capsHash, current: newHash } }));
      }
      setCapsHash(newHash);
      setCapabilities(newCaps);
      setLimits(data.limits || {});
      setUsage(data.usage || {});
      setAttempt(0);
    } catch (e:any) {
      setError(e.message || 'Erro');
      const next = currentAttempt + 1;
      setAttempt(next);
      if (next <= 6) { // up to ~32s cap
        scheduleRetry(next);
      }
    } finally { setLoading(false); }
  }, [authenticatedFetch, etag, capsHash, retryTimer, scheduleRetry]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = () => load(true);
    window.addEventListener('entitlements:refresh', handler as any);
    // Invalidate patterns from overrides component
    const invalidateHandler = () => load(true);
    window.addEventListener('entitlements:invalidate', invalidateHandler as any);
    return () => {
      window.removeEventListener('entitlements:refresh', handler as any);
      window.removeEventListener('entitlements:invalidate', invalidateHandler as any);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [load, retryTimer]);

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
