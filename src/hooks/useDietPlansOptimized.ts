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
      const endpoint = API.DIET_PLANS.replace(import.meta.env.VITE_API_URL || 'https://login-service.avantenutri.workers.dev', '');
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
      const endpoint = API.DIET_PLANS.replace(import.meta.env.VITE_API_URL || 'https://login-service.avantenutri.workers.dev', '');
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
      // legado (será descontinuado): metas isoladas
      meta_kcal?: string;
      meta_protein_g?: string;
      meta_carbs_g?: string;
      meta_fat_g?: string;
      // novo formato estruturado
      structured_data?: any; // usar tipos de StructuredDietData; mantemos any para flexibilidade inicial
      pdf_base64?: string;
      pdf_filename?: string;
    }) => {
      if (!can(CAPABILITIES.DIETA_EDIT)) {
        throw new Error('Sem permissão para criar dietas');
      }

      const endpoint = API.DIET_PLANS.replace(import.meta.env.VITE_API_URL || 'https://login-service.avantenutri.workers.dev', '');
      const payload = { ...input } as any;
      if (input.format === 'structured') {
        // Se structured_data presente, removemos metas antigas desnecessárias
        if (payload.structured_data) {
          delete payload.meta_kcal;
          delete payload.meta_protein_g;
          delete payload.meta_carbs_g;
          delete payload.meta_fat_g;
        }
      }
      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar plano');
      }

      return data;
    },
    // Optimistic create: adiciona entrada temporária para feedback instantâneo
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['diet-plans'] });
      const prev = queryClient.getQueryData<DietPlanSummary[]>(['diet-plans', {}]);
      const tempId = 'temp-' + Date.now();
      const optimistic: DietPlanSummary = {
        id: tempId,
        name: input.name,
        description: input.description || null,
        status: 'active',
        start_date: null,
        end_date: null,
        results_summary: null,
        current_version_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      queryClient.setQueryData<DietPlanSummary[]>(['diet-plans', {}], (old) => {
        if (!old) return [optimistic];
        return [optimistic, ...old];
      });
      return { prev, tempId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['diet-plans', {}], ctx.prev);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diet-plans'] });
    },
    onSettled: () => {
      // Garantir refetch para substituir a entrada otimista
      queryClient.invalidateQueries({ queryKey: ['diet-plans'] });
    }
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

      const endpoint = API.DIET_PLANS.replace(import.meta.env.VITE_API_URL || 'https://login-service.avantenutri.workers.dev', '');
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
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ['diet-plan-detail', vars.planId, false] });
      await queryClient.cancelQueries({ queryKey: ['diet-plan-detail', vars.planId, true] });
      const prevDetailFalse = queryClient.getQueryData<DietPlanDetail>(['diet-plan-detail', vars.planId, false]);
      const prevDetailTrue = queryClient.getQueryData<DietPlanDetail>(['diet-plan-detail', vars.planId, true]);
      const base = prevDetailTrue || prevDetailFalse;
      if (base) {
        const optimisticVersion: DietPlanVersion = {
          id: 'temp-rev-' + Date.now(),
          version_number: (base.versions[0]?.version_number || 0) + 1,
          generated_by: 'you',
          created_at: new Date().toISOString(),
          notes: vars.notes || 'Revisão em andamento...',
          data: vars.includeData ? { pending: true } : undefined,
        };
        const updated: DietPlanDetail = {
          ...base,
            // assumindo ordem desc (mais recente primeiro)
          versions: [optimisticVersion, ...base.versions],
          current_version_id: optimisticVersion.id,
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData(['diet-plan-detail', vars.planId, false], updated);
        queryClient.setQueryData(['diet-plan-detail', vars.planId, true], updated);
      }
      return { prevDetailFalse, prevDetailTrue };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prevDetailFalse)
        queryClient.setQueryData(['diet-plan-detail', vars.planId, false], ctx.prevDetailFalse);
      if (ctx?.prevDetailTrue)
        queryClient.setQueryData(['diet-plan-detail', vars.planId, true], ctx.prevDetailTrue);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diet-plans'] });
      queryClient.invalidateQueries({ queryKey: ['diet-plan-detail', variables.planId] });
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ['diet-plan-detail', vars.planId, false] });
      queryClient.invalidateQueries({ queryKey: ['diet-plan-detail', vars.planId, true] });
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
        const endpoint = API.DIET_PLANS.replace(import.meta.env.VITE_API_URL || 'https://login-service.avantenutri.workers.dev', '');
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

export function prefetchDietPlans(qc: ReturnType<typeof useQueryClient>, fetcher: (input: RequestInfo, init?: RequestInit)=>Promise<Response>, options: { archived?: boolean } = {}) {
  const endpoint = API.DIET_PLANS.replace(import.meta.env.VITE_API_URL || 'https://login-service.avantenutri.workers.dev', '');
  const params = new URLSearchParams();
  if (options.archived !== undefined) params.append('archived', options.archived.toString());
  const url = params.toString() ? `${endpoint}?${params}` : endpoint;
  qc.prefetchQuery({
    queryKey: ['diet-plans', options],
    queryFn: async () => {
      const r = await fetcher(url);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Falha ao carregar planos de dieta');
      return data.results || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function prefetchDietPlanDetail(qc: ReturnType<typeof useQueryClient>, fetcher: (input: RequestInfo, init?: RequestInit)=>Promise<Response>, planId: string, includeData = false) {
  if (!planId) return;
  const endpoint = API.DIET_PLANS.replace(import.meta.env.VITE_API_URL || 'https://login-service.avantenutri.workers.dev', '');
  const params = new URLSearchParams();
  if (includeData) params.append('include_data','true');
  const url = params.toString() ? `${endpoint}/${planId}?${params}` : `${endpoint}/${planId}`;
  qc.prefetchQuery({
    queryKey: ['diet-plan-detail', planId, includeData],
    queryFn: async () => {
      const r = await fetcher(url);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Falha ao carregar detalhes do plano');
      return data.plan;
    },
    staleTime: 10 * 60 * 1000,
  });
}