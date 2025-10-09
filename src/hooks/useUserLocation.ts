import { useCallback, useEffect, useState } from 'react';

type Coords = { lat: number; lon: number };

const LS_KEY = 'user.location.coords.v1';

function loadCached(): Coords | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (typeof v?.lat === 'number' && typeof v?.lon === 'number') return v as Coords;
    return null;
  } catch { return null; }
}

function saveCached(coords: Coords) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(coords)); }
  catch { /* ignore quota/unavailable */ }
}

export function useUserLocation(opts?: { auto?: boolean }) {
  const [coords, setCoords] = useState<Coords | null>(() => loadCached());
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>(coords ? 'success' : 'idle');
  const [error, setError] = useState<string | null>(null);

  const set = useCallback((c: Coords) => {
    setCoords(c);
    saveCached(c);
    setStatus('success');
  }, []);

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocalização não suportada');
      setStatus('error');
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        set(c);
      },
      (err) => {
        setError(err?.message || 'Permissão negada');
        setStatus('error');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, [set]);

  // Auto-attempt only if permission already granted
  useEffect(() => {
    if (coords || opts?.auto === false) return;
    const perms: Permissions | undefined = (navigator as unknown as { permissions?: Permissions }).permissions;
    if (perms && perms.query) {
      perms.query({ name: 'geolocation' as PermissionName }).then((res) => {
        if (res.state === 'granted') request();
      }).catch(() => { /* ignore */ });
    }
  }, [coords, opts?.auto, request]);

  return { coords, status, error, request, setCoords: set };
}
