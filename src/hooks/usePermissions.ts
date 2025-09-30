import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../contexts";
import { API } from "../config/api";

// -------- GLOBAL STORE (singleton) --------
interface EntitlementsResponse { capabilities: string[]; limits: Record<string, number | null>; hash?: string | null; version?: number | null; usage?: Record<string, any>; }
interface GlobalPermissionsState {
  capabilities: string[];
  limits: Record<string, number | null>;
  usage: Record<string, any>;
  loading: boolean;
  loaded: boolean; // já tivemos uma resposta (mesmo erro)
  error: string | null;
  etag: string | null;
  hash: string | null;
  attempt: number;
}

const state: GlobalPermissionsState = {
  capabilities: [],
  limits: {},
  usage: {},
  loading: false,
  loaded: false,
  error: null,
  etag: null,
  hash: null,
  attempt: 0,
};

const subscribers = new Set<() => void>();
let fetchInFlight: Promise<void> | null = null;
let retryTimer: number | null = null;
const SS_KEY = 'perm:v1'; // sessionStorage key (versão simples para invalidação futura)
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

function notify() { subscribers.forEach(fn => { try { fn(); } catch {} }); }

export function usePermissions() {
  const { authenticatedFetch } = useAuth();
  const [, forceRender] = useState(0);
  const authFetchRef = useRef(authenticatedFetch);
  authFetchRef.current = authenticatedFetch; // sempre atualizado sem recriar funções

  // Hidratar de sessionStorage (apenas uma vez por sessão)
  useEffect(() => {
    if (!state.loaded) {
      try {
        const raw = sessionStorage.getItem(SS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const ts: number | undefined = parsed?.ts;
          const expired = !ts || (Date.now() - ts) > CACHE_TTL_MS;
          if (!expired && parsed && Array.isArray(parsed.capabilities)) {
            state.capabilities = parsed.capabilities;
            state.limits = parsed.limits || {};
            state.usage = parsed.usage || {};
            state.hash = parsed.hash || null;
            state.etag = parsed.etag || null;
            state.loaded = true; // marcamos como carregado via cache
            notify();
          } else if (expired) {
            sessionStorage.removeItem(SS_KEY);
          }
        }
      } catch {}
    }
  }, []);

  const load = useCallback(async (force = false) => {
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    if (state.loading && fetchInFlight) return fetchInFlight;
    if (!force && state.loaded && !state.error) return fetchInFlight; // já temos dados válidos
    state.loading = true; state.error = null; notify();
    const doFetch = async () => {
      try {
        const headers: Record<string,string> = {};
        if (state.etag && !force) headers['If-None-Match'] = state.etag;
        const r = await authFetchRef.current(API.ENTITLEMENTS, { method: 'GET', autoLogout: true, headers });
        if (r.status === 304) {
          state.loading = false; state.loaded = true; notify(); return;
        }
        if (!r.ok) throw new Error('Falha ao carregar entitlements');
        const newEtag = r.headers.get('ETag'); if (newEtag) state.etag = newEtag;
        const data: EntitlementsResponse = await r.json();
        const newCaps = data.capabilities || [];
        const newHash = newCaps.slice().sort().join('|');
        if (state.hash && state.hash !== newHash) {
          window.dispatchEvent(new CustomEvent('entitlements:changed', { detail: { previous: state.hash, current: newHash } }));
        }
        state.hash = newHash;
        state.capabilities = newCaps;
        state.limits = data.limits || {};
        state.usage = data.usage || {};
        state.attempt = 0;
        state.error = null;
        // Persistir
        try { sessionStorage.setItem(SS_KEY, JSON.stringify({
          capabilities: state.capabilities,
          limits: state.limits,
            usage: state.usage,
            hash: state.hash,
            etag: state.etag,
          ts: Date.now()
        })); } catch {}
      } catch (e:any) {
        state.error = e.message || 'Erro';
        const next = state.attempt + 1;
        state.attempt = next;
        if (next <= 6) {
          const base = 500; const max = 30000; const exp = Math.min(max, base * Math.pow(2, next));
          const delay = Math.floor(Math.random() * exp);
            retryTimer = window.setTimeout(() => { load(false); }, delay);
        }
      } finally {
        state.loading = false; state.loaded = true; notify();
      }
    };
    fetchInFlight = doFetch();
    return fetchInFlight;
  }, []);

  // Assinar mudanças
  useEffect(() => {
    const sub = () => forceRender(x => x + 1);
    subscribers.add(sub);
    // primeira vez: dispara load se necessário
    if (!state.loaded && !state.loading) load(false);
    return () => { subscribers.delete(sub); };
  }, [load]);

  // Eventos externos
  useEffect(() => {
    const refreshHandler = () => load(true);
    const invalidateHandler = () => load(true);
    window.addEventListener('entitlements:refresh', refreshHandler as any);
    window.addEventListener('entitlements:invalidate', invalidateHandler as any);
    return () => {
      window.removeEventListener('entitlements:refresh', refreshHandler as any);
      window.removeEventListener('entitlements:invalidate', invalidateHandler as any);
    };
  }, [load]);

  const can = useCallback((code: string) => {
    if (!state.loaded) return false; // enquanto não carregou, tratamos como "indeterminado"; PermissionGate pode usar loading
    return state.capabilities.includes(code);
  }, []);
  const any = useCallback((codes: string[]) => {
    if (!state.loaded) return false;
    return codes.some(c => state.capabilities.includes(c));
  }, []);
  const all = useCallback((codes: string[]) => {
    if (!state.loaded) return false;
    return codes.every(c => state.capabilities.includes(c));
  }, []);

  return {
    capabilities: state.capabilities,
    limits: state.limits,
    usage: state.usage,
    loading: state.loading && !state.loaded,
    reloading: state.loading && state.loaded,
    ready: state.loaded && !state.loading,
    error: state.error,
    can, any, all,
    reload: () => load(true),
    attempt: state.attempt,
  };
}
