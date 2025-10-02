// Simplified permissions model: all users have full access.
// This hook now returns static data for backwards compatibility.
import { useCallback } from 'react';

// -------- GLOBAL STORE (singleton) --------
export function usePermissions() {
  const can = useCallback((_code: string) => true, []);
  const any = useCallback((_codes: string[]) => true, []);
  const all = useCallback((_codes: string[]) => true, []);
  return {
    capabilities: [],
    limits: {},
    usage: {},
    loading: false,
    reloading: false,
    ready: true,
    error: null,
    can, any, all,
    reload: () => {},
    attempt: 0,
  };
}
