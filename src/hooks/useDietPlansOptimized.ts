import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedFetch } from './useApi';
import { API } from '../config/api';
import { usePermissions } from './usePermissions';
import { CAPABILITIES } from '../types/capabilities';

// Types
export interface DietPlanSummary {
  id: string;
  name: string;
  description?: string | null;
  status: 'active' | 'archived';
  start_date?: string | null;
  end_date?: string | null;
  results_summary?: string | null;
  current_version_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DietPlanVersion {
  id: string;
  version_number: number;
  generated_by: string;
  created_at: string;
  notes?: string | null;
  data?: any;
}

export interface DietPlanDetail extends DietPlanSummary {
  versions: DietPlanVersion[];
}

// Query para buscar planos de dieta
export const useDietPlansQuery = (options: { archived?: boolean } = {}) => {
  const authenticatedFetch = useAuthenticatedFetch();
  const { can } = usePermissions();

  return useQuery({
    queryKey: ['diet-plans', options],
    queryFn: async (): Promise<DietPlanSummary[]> => {
      const endpoint = API.DIET_PLANS.replace(import.meta.env.VITE_API_URL || 'https://api.avantenutri.com.br', '');
      const params = new URLSearchParams();
      if (options.archived !== undefined) {
        params.append('archived', options.archived.toString());
      }
      
      const url = params.toString() ? `${endpoint}?${params}` : endpoint;
      const response = await authenticatedFetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao carregar planos de dieta');
      }

      return data.results || [];
    },
    enabled: can(CAPABILITIES.DIETA_VIEW),
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
};

// Query para buscar detalhes de um plano específico
export const useDietPlanDetailQuery = (planId: string, includeData = false) => {
  const authenticatedFetch = useAuthenticatedFetch();
  const { can } = usePermissions();

  return useQuery({
    queryKey: ['diet-plan-detail', planId, includeData],
    queryFn: async (): Promise<DietPlanDetail> => {
      const endpoint = API.DIET_PLANS.replace(import.meta.env.VITE_API_URL || 'https://api.avantenutri.com.br', '');
      const params = new URLSearchParams();
      if (includeData) {
        params.append('include_data', 'true');
      }
      
      const url = params.toString() ? `${endpoint}/${planId}?${params}` : `${endpoint}/${planId}`;
      const response = await authenticatedFetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao carregar detalhes do plano');
      }

      return data.plan;
    },
    enabled: !!planId && can(CAPABILITIES.DIETA_VIEW),
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
};

// Hook otimizado para planos de dieta
export const useDietPlans = () => {
  const queryClient = useQueryClient();
  const authenticatedFetch = useAuthenticatedFetch();
  const { can } = usePermissions();

  const plansQuery = useDietPlansQuery();

  const createMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      format: 'structured' | 'pdf';
      meta_kcal?: string;
      meta_protein_g?: string;
      meta_carbs_g?: string;
      meta_fat_g?: string;
      pdf_base64?: string;
      pdf_filename?: string;
    }) => {
      if (!can(CAPABILITIES.DIETA_EDIT)) {
        throw new Error('Sem permissão para criar dietas');
      }

      const endpoint = API.DIET_PLANS.replace(import.meta.env.VITE_API_URL || 'https://api.avantenutri.com.br', '');
      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar plano');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-plans'] });
    },
  });

  const reviseMutation = useMutation({
    mutationFn: async ({
      planId,
      notes,
      includeData = false,
    }: {
      planId: string;
      notes?: string;
      includeData?: boolean;
    }) => {
      if (!can(CAPABILITIES.DIETA_EDIT)) {
        throw new Error('Sem permissão para revisar dietas');
      }

      const endpoint = API.DIET_PLANS.replace(import.meta.env.VITE_API_URL || 'https://api.avantenutri.com.br', '');
      const body: any = {};
      if (notes) body.notes = notes;
      if (includeData) body.include_data = true;

      const response = await authenticatedFetch(`${endpoint}/${planId}/revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao revisar plano');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diet-plans'] });
      queryClient.invalidateQueries({ queryKey: ['diet-plan-detail', variables.planId] });
    },
  });

  // Função para buscar detalhes de um plano específico
  const getDetail = async (planId: string, includeData = false) => {
    const queryKey = ['diet-plan-detail', planId, includeData];
    const cached = queryClient.getQueryData(queryKey);
    
    if (cached) {
      return cached;
    }

    return await queryClient.fetchQuery({
      queryKey,
      queryFn: async () => {
        const endpoint = API.DIET_PLANS.replace(import.meta.env.VITE_API_URL || 'https://api.avantenutri.com.br', '');
        const params = new URLSearchParams();
        if (includeData) {
          params.append('include_data', 'true');
        }
        
        const url = params.toString() ? `${endpoint}/${planId}?${params}` : `${endpoint}/${planId}`;
        const response = await authenticatedFetch(url);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Falha ao carregar detalhes do plano');
        }

        return data.plan;
      },
      staleTime: 10 * 60 * 1000,
    });
  };

  return {
    plans: plansQuery.data || [],
    loading: plansQuery.isLoading,
    error: plansQuery.error,
    load: () => plansQuery.refetch(), // Para compatibilidade com versão antiga
    create: createMutation.mutateAsync,
    creating: createMutation.isPending,
    revise: reviseMutation.mutateAsync,
    revising: reviseMutation.isPending ? reviseMutation.variables?.planId || '' : null,
    getDetail,
  };
};