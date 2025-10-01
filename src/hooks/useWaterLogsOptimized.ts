import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedFetch } from './useApi';
import { API } from '../config/api';

// Types
export interface WaterLog {
  id: string;
  log_datetime: string;
  log_date: string;
  amount_ml: number;
  created_at: string;
  updated_at: string;
}

interface SummaryDay {
  date: string;
  total_ml: number;
  count: number;
}

interface SummaryStats {
  totalMl: number;
  avgDaily: number;
  maxDaily: number;
  goal_ml: number;
}

interface SummaryResponse {
  ok?: boolean;
  range?: { from: string; to: string };
  days?: SummaryDay[];
  stats?: SummaryStats | null;
  error?: string;
}

// Query para buscar logs de água
export const useWaterLogsQuery = (days = 7) => {
  const authenticatedFetch = useAuthenticatedFetch();

  return useQuery({
    queryKey: ['water-logs', days],
    queryFn: async () => {
      const end = new Date();
      const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
      start.setUTCDate(start.getUTCDate() - (days - 1));
      const pad = (n: number) => String(n).padStart(2, '0');
      const fmt = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
      const fromStr = fmt(start);
      const toStr = fmt(end);

      const endpoint = API.WATER_LOGS.replace(import.meta.env.VITE_API_URL || 'https://api.avantenutri.com.br', '');
      const response = await authenticatedFetch(`${endpoint}?from=${fromStr}&to=${toStr}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao carregar água');
      }

      return {
        results: data.results || [],
        range: data.range
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
  });
};

// Query para buscar resumo de água
export const useWaterSummaryQuery = (days = 7) => {
  const authenticatedFetch = useAuthenticatedFetch();

  return useQuery({
    queryKey: ['water-summary', days],
    queryFn: async (): Promise<SummaryResponse> => {
      const endpoint = API.WATER_SUMMARY.replace(import.meta.env.VITE_API_URL || 'https://api.avantenutri.com.br', '');
      const response = await authenticatedFetch(`${endpoint}?days=${days}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao carregar resumo de água');
      }

      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
  });
};

// Hook otimizado que combina logs e summary
export const useWaterLogs = (days = 7) => {
  const queryClient = useQueryClient();
  const authenticatedFetch = useAuthenticatedFetch();

  const logsQuery = useWaterLogsQuery(days);
  const summaryQuery = useWaterSummaryQuery(days);

  const addMutation = useMutation({
    mutationFn: async (amount_ml: number = 250) => {
      const endpoint = API.WATER_LOGS.replace(import.meta.env.VITE_API_URL || 'https://api.avantenutri.com.br', '');
      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_ml }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar água');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-logs'] });
      queryClient.invalidateQueries({ queryKey: ['water-summary'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const endpoint = API.WATER_LOGS.replace(import.meta.env.VITE_API_URL || 'https://api.avantenutri.com.br', '');
      const response = await authenticatedFetch(`${endpoint}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao excluir');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-logs'] });
      queryClient.invalidateQueries({ queryKey: ['water-summary'] });
    },
  });

  // Dados derivados
  const logs = logsQuery.data?.results || [];
  const summary = summaryQuery.data;
  const loading = logsQuery.isLoading || summaryQuery.isLoading;
  const error = logsQuery.error || summaryQuery.error;

  // Calcular dados para hoje
  const today = new Date().toISOString().split('T')[0];
  const todayStats = summary?.days?.find(day => day.date === today);
  const totalToday = todayStats?.total_ml || 0;
  const dailyGoalMl = summary?.stats?.goal_ml || 2000;
  const dailyGoalCups = Math.ceil(dailyGoalMl / 250); // Assumindo 250ml por copo

  return {
    logs,
    summary,
    loading,
    error,
    range: logsQuery.data?.range,
    totalToday,
    dailyGoalMl,
    dailyGoalCups,
    add: addMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    adding: addMutation.isPending,
    deleting: deleteMutation.isPending,
  };
};