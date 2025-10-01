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
    },
    mutations: {
      retry: 1,
    },
  },
});