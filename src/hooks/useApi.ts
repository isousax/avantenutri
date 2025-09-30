import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts';
import { API } from '../config/api';

// URLs da API
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.avantenutri.com.br';

// Hook para fetch autenticado
export const useAuthenticatedFetch = () => {
  const { getAccessToken } = useAuth();

  const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Token de acesso não disponível');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  return authenticatedFetch;
};

// Hook para dados do usuário
export const useUserData = () => {
  const authenticatedFetch = useAuthenticatedFetch();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user', user?.id],
    queryFn: () => authenticatedFetch(API.ME.replace(`${API_BASE}`, '')),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutos para dados do usuário
  });
};

// Hook para dados do dashboard
export const useDashboardData = () => {
  const authenticatedFetch = useAuthenticatedFetch();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async () => {
      // Usar endpoints que realmente existem
      const [profile] = await Promise.all([
        authenticatedFetch(API.PROFILE.replace(`${API_BASE}`, '')),
      ]);
      return { profile };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos para dados do dashboard
  });
};

// Hook para registros de água
export const useWaterIntake = () => {
  const authenticatedFetch = useAuthenticatedFetch();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['water-intake', user?.id],
    queryFn: () => authenticatedFetch(API.WATER_LOGS.replace(`${API_BASE}`, '')),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutos para registros de água
  });
};

// Hook para adicionar registro de água
export const useAddWaterIntake = () => {
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (amount: number) => 
      authenticatedFetch(API.WATER_LOGS.replace(`${API_BASE}`, ''), {
        method: 'POST',
        body: JSON.stringify({ amount, timestamp: new Date().toISOString() }),
      }),
    onSuccess: () => {
      // Invalidar cache dos registros de água para refetch
      queryClient.invalidateQueries({ queryKey: ['water-intake', user?.id] });
      // Invalidar dashboard também se mostra estatísticas de água
      queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id] });
    },
  });
};

// Hook para consultas
export const useConsultations = () => {
  const authenticatedFetch = useAuthenticatedFetch();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['consultations', user?.id],
    queryFn: () => authenticatedFetch(API.CONSULTATIONS.replace(`${API_BASE}`, '')),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutos para consultas
  });
};

// Hook para histórico de pagamentos
export const usePaymentHistory = () => {
  const authenticatedFetch = useAuthenticatedFetch();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payments', user?.id],
    queryFn: () => authenticatedFetch(API.BILLING_PAYMENTS.replace(`${API_BASE}`, '')),
    enabled: !!user?.id,
    staleTime: 15 * 60 * 1000, // 15 minutos para pagamentos
  });
};

// Hook genérico para invalidar cache do usuário
export const useInvalidateUserCache = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', user.id] });
      queryClient.invalidateQueries({ queryKey: ['water-intake', user.id] });
      queryClient.invalidateQueries({ queryKey: ['consultations', user.id] });
      queryClient.invalidateQueries({ queryKey: ['payments', user.id] });
    }
  };
};