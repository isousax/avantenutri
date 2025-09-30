import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 15 minutos
      staleTime: 15 * 60 * 1000,
      // Manter cache por 30 minutos mesmo quando não usado
      gcTime: 30 * 60 * 1000,
      // Retry apenas uma vez para evitar delays
      retry: 1,
      // Refetch apenas quando janela volta ao foco se dados estão muito antigos (5 min)
      refetchOnWindowFocus: (query) => {
        return Date.now() - (query.state.dataUpdatedAt || 0) > 5 * 60 * 1000;
      },
      // Não refetch em reconexão automática
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations apenas uma vez
      retry: 1,
    },
  },
});