import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache agressivo para reduzir requisições duplicadas
      staleTime: 10 * 60 * 1000, // 10 minutos
      gcTime: 30 * 60 * 1000, // 30 minutos
      retry: 1,
      refetchOnWindowFocus: false, // Desabilitar refetch no foco para reduzir requisições
      refetchOnReconnect: false, // Desabilitar refetch na reconexão
      refetchOnMount: (query) => {
        // Só refetch se os dados estão muito antigos (5 min)
        return Date.now() - (query.state.dataUpdatedAt || 0) > 5 * 60 * 1000;
      },
  placeholderData: (prev: unknown) => prev, // mantém último valor instantaneamente
    },
    mutations: {
      retry: 1,
    },
  },
});

// Persistência simples (localStorage) — degrade para no-op em ambientes sem window
if (typeof window !== 'undefined') {
  try {
    const STORAGE_KEY = 'rq-cache-v1';
    const persisted = window.localStorage.getItem(STORAGE_KEY);
    if (persisted) {
      const parsed = JSON.parse(persisted);
      if (parsed?.clientState?.queries) {
        for (const q of parsed.clientState.queries) {
          if (q?.queryKey && q.state?.data !== undefined) {
            queryClient.setQueryData(q.queryKey, q.state.data);
          }
        }
      }
    }
    // Agendar persist periódico
    let persistTimeout: number | null = null;
    const schedulePersist = () => {
      if (persistTimeout) window.clearTimeout(persistTimeout);
      persistTimeout = window.setTimeout(() => {
        try {
          const qcState = {
            queries: queryClient.getQueryCache().getAll().map(q => ({
              queryKey: q.queryKey,
              state: {
                data: q.state.data,
                dataUpdatedAt: q.state.dataUpdatedAt,
                status: q.state.status,
                error: q.state.error,
              }
            }))
          };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ clientState: qcState, v:1 }));
        } catch {}
      }, 800);
    };
    queryClient.getQueryCache().subscribe(schedulePersist);
  } catch {}
}
