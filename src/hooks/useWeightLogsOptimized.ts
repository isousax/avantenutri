import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedFetch } from './useApi';
import { API } from '../config/api';
import { usePermissions } from './usePermissions';
import { CAPABILITIES } from '../types/capabilities';

// Types
export interface WeightLog {
  id: string;
  log_date: string;
  weight_kg: number;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

interface SummaryPoint {
  date: string;
  weight_kg: number;
}

interface SummaryStats {
  first: SummaryPoint;
  latest: SummaryPoint;
  diff_kg: number;
  diff_percent: number | null;
  min: SummaryPoint;
  max: SummaryPoint;
  trend_slope: number;
  weight_goal_kg?: number | null;
}

interface SummaryResponse {
  ok?: boolean;
  range?: { from: string; to: string };
  series?: SummaryPoint[];
  stats?: SummaryStats | null;
  error?: string;
}

// Query para buscar logs de peso
export const useWeightLogsQuery = (days = 90) => {
  const authenticatedFetch = useAuthenticatedFetch();
  const { can } = usePermissions();

  return useQuery({
    queryKey: ['weight-logs', days],
    queryFn: async () => {
      if (!can(CAPABILITIES.PESO_LOG)) {
        return { results: [], range: null };
      }

      const today = new Date();
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      start.setUTCDate(start.getUTCDate() - (days - 1));
      const pad = (n: number) => String(n).padStart(2, '0');
      const fmt = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
      const fromStr = fmt(start);
      const toStr = fmt(today);

      const endpoint = API.WEIGHT_LOGS;
      const response = await authenticatedFetch(`${endpoint}?from=${fromStr}&to=${toStr}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao carregar peso');
      }

      return {
        results: data.results || [],
        range: data.range
      };
    },
    enabled: can(CAPABILITIES.PESO_LOG),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
};

// Query para buscar resumo de peso
export const useWeightSummaryQuery = (days = 90) => {
  const authenticatedFetch = useAuthenticatedFetch();
  const { can } = usePermissions();

  return useQuery({
    queryKey: ['weight-summary', days],
    queryFn: async (): Promise<SummaryResponse> => {
      if (!can(CAPABILITIES.PESO_LOG)) {
        return { ok: false };
      }

      const endpoint = API.WEIGHT_SUMMARY;
      const response = await authenticatedFetch(`${endpoint}?days=${days}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao carregar resumo de peso');
      }

      return data;
    },
    enabled: can(CAPABILITIES.PESO_LOG),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
};

// Hook otimizado que combina logs e summary
export const useWeightLogs = (days = 90) => {
  const queryClient = useQueryClient();
  const authenticatedFetch = useAuthenticatedFetch();
  const { can } = usePermissions();

  const logsQuery = useWeightLogsQuery(days);
  const summaryQuery = useWeightSummaryQuery(days);

  const upsertMutation = useMutation({
    mutationFn: async (data: { weight_kg: number; note?: string; date?: string }) => {
      if (!can(CAPABILITIES.PESO_LOG)) {
        throw new Error('Sem permissão');
      }

      const endpoint = API.WEIGHT_LOGS;
      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar peso');
      }

      return result;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['weight-logs'] });
      queryClient.invalidateQueries({ queryKey: ['weight-summary'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!can(CAPABILITIES.PESO_LOG)) {
        throw new Error('Sem permissão');
      }

      const endpoint = API.WEIGHT_LOGS;
      const response = await authenticatedFetch(`${endpoint}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao excluir peso');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-logs'] });
      queryClient.invalidateQueries({ queryKey: ['weight-summary'] });
    },
  });

  // Dados derivados
  const logs = logsQuery.data?.results || [];
  const summary = summaryQuery.data;
  const latest = summary?.stats?.latest;
  const goal = summary?.stats?.weight_goal_kg;
  const loading = logsQuery.isLoading || summaryQuery.isLoading;
  const error = logsQuery.error || summaryQuery.error;

  return {
    logs,
    summary,
    latest,
    goal,
    loading,
    error,
    range: logsQuery.data?.range,
    upsert: upsertMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    upserting: upsertMutation.isPending,
    deleting: deleteMutation.isPending,
  };
};