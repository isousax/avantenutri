import { useEffect, useState, useCallback } from 'react';

/**
 * Hook para gerenciar o query param ?intent= na página de planos.
 * Ex: /planos?intent=consultation quando usuário tenta agendar consulta sem capability.
 * Fornece o intent atual e função para limpar (substitui estado do histórico para evitar repetição).
 */
export function usePlanIntent() {
  const [intent, setIntent] = useState<string | null>(null);

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const value = sp.get('intent');
      if (value) setIntent(value);
    } catch {
      /* noop */
    }
  }, []);

  const clearIntent = useCallback(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('intent');
      window.history.replaceState({}, '', url.toString());
    } catch {
      /* noop */
    }
    setIntent(null);
  }, []);

  return { intent, clearIntent };
}
