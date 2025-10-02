import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedFetch } from './useApi';
import { API } from '../config/api';

// Types
export interface MealLog {
  id: string;
  log_datetime: string;
  log_date: string;
  meal_type: string;
  description?: string | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  created_at: string;
  updated_at: string;
}

interface SummaryDay {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  count: number;
}

interface SummaryStats {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  avgCalories: number;
}

interface Goals {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

interface SummaryResponse {
  ok?: boolean;
  range?: { from: string; to: string };
  days?: SummaryDay[];
  stats?: SummaryStats | null;
  goals?: Goals;
  error?: string;
}

// Query para buscar logs de refeições
export const useMealLogsQuery = (days = 7) => {
  const authenticatedFetch = useAuthenticatedFetch();

  return useQuery({
    queryKey: ['meal-logs', days],
    queryFn: async () => {
      const end = new Date();
      const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
      start.setUTCDate(start.getUTCDate() - (days - 1));
      const pad = (n: number) => String(n).padStart(2, '0');
      const fmt = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
      const fromStr = fmt(start);
      const toStr = fmt(end);

      const endpoint = API.MEAL_LOGS.replace(import.meta.env.VITE_API_URL || 'https://login-service.avantenutri.workers.dev', '');
      const response = await authenticatedFetch(`${endpoint}?from=${fromStr}&to=${toStr}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao carregar refeições');
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

// Query para buscar resumo de refeições
export const useMealSummaryQuery = (days = 7) => {
  const authenticatedFetch = useAuthenticatedFetch();

  return useQuery({
    queryKey: ['meal-summary', days],
    queryFn: async (): Promise<SummaryResponse> => {
      const endpoint = API.MEAL_SUMMARY.replace(import.meta.env.VITE_API_URL || 'https://login-service.avantenutri.workers.dev', '');
      const response = await authenticatedFetch(`${endpoint}?days=${days}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao carregar resumo de refeições');
      }

      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
  });
};

// Hook otimizado que combina logs e summary
export const useMealLogs = (days = 7) => {
  const queryClient = useQueryClient();
  const authenticatedFetch = useAuthenticatedFetch();

  const logsQuery = useMealLogsQuery(days);
  const summaryQuery = useMealSummaryQuery(days);

  const createMutation = useMutation({
    mutationFn: async (input: {
      meal_type: string;
      description?: string;
      calories?: number;
      protein_g?: number;
      carbs_g?: number;
      fat_g?: number;
      datetime?: string;
    }) => {
      const endpoint = API.MEAL_LOGS.replace(import.meta.env.VITE_API_URL || 'https://login-service.avantenutri.workers.dev', '');
      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-logs'] });
      queryClient.invalidateQueries({ queryKey: ['meal-summary'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        description: string;
        calories: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
      }>;
    }) => {
      const endpoint = API.MEAL_LOGS.replace(import.meta.env.VITE_API_URL || 'https://login-service.avantenutri.workers.dev', '');
      const response = await authenticatedFetch(`${endpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-logs'] });
      queryClient.invalidateQueries({ queryKey: ['meal-summary'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const endpoint = API.MEAL_LOGS.replace(import.meta.env.VITE_API_URL || 'https://login-service.avantenutri.workers.dev', '');
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
      queryClient.invalidateQueries({ queryKey: ['meal-logs'] });
      queryClient.invalidateQueries({ queryKey: ['meal-summary'] });
    },
  });

  // Dados derivados
  const logs = logsQuery.data?.results || [];
  const summary = summaryQuery.data;
  const loading = logsQuery.isLoading || summaryQuery.isLoading;
  const error = logsQuery.error || summaryQuery.error;

  // Progress calculation
  const goals = summary?.goals;
  const todayStats = summary?.days?.find(day => day.date === new Date().toISOString().split('T')[0]);
  
  const progress = {
    calories: goals?.calories && todayStats ? Math.min((todayStats.calories / goals.calories) * 100, 100) : 0,
    protein: goals?.protein_g && todayStats ? Math.min((todayStats.protein_g / goals.protein_g) * 100, 100) : 0,
    carbs: goals?.carbs_g && todayStats ? Math.min((todayStats.carbs_g / goals.carbs_g) * 100, 100) : 0,
    fat: goals?.fat_g && todayStats ? Math.min((todayStats.fat_g / goals.fat_g) * 100, 100) : 0,
  };

  return {
    logs,
    summary,
    loading,
    error,
    range: logsQuery.data?.range,
    progress,
    goals,
    create: createMutation.mutateAsync,
    patch: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
  };
};