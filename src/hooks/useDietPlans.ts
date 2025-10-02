// -------------------------------------------------------------
// MIGRAÇÃO: Este arquivo foi convertido para um wrapper em cima da
// implementação otimizada com React Query (`useDietPlansOptimized.ts`).
// Mantemos a mesma interface pública para evitar refactors extensos
// nos componentes existentes. Estados manuais foram eliminados.
// -------------------------------------------------------------

import { useQueryClient } from '@tanstack/react-query';
import { API } from '../config/api';
import { useAuthenticatedFetch } from './useApi';
// (Permissões específicas não são necessárias aqui; a versão otimizada já faz checagens onde relevante)
import { useDietPlans as useDietPlansOptimized } from './useDietPlansOptimized';

// Re-exportar os tipos da versão otimizada (garante compatibilidade)
export type { DietPlanSummary, DietPlanVersion, DietPlanDetail } from './useDietPlansOptimized';

export function useDietPlans() {
  const base = useDietPlansOptimized();
  const queryClient = useQueryClient();
  const authenticatedFetch = useAuthenticatedFetch();

  // detailCache removido (mantido legado anteriormente) – não mais necessário.

  // updateMeta preserva semântica antiga + invalidação
  const updateMeta = async (planId: string, payload: Partial<{ name: string; description: string; status: 'active'|'archived'; results_summary: string; start_date: string; end_date: string; }>) => {
    if (!planId) return false;
    try {
      const resp = await authenticatedFetch(API.dietPlan(planId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Falha ao atualizar');
      // Invalidate lists & detail
      queryClient.invalidateQueries({ queryKey: ['diet-plans'] });
      queryClient.invalidateQueries({ queryKey: ['diet-plan-detail', planId] });
      return true;
    } catch (e) {
      console.warn('[useDietPlans.updateMeta] erro', e);
      return false;
    }
  };

  // load() compat: apenas aciona refetch
  const load = async () => { await base.load(); };

  // criar wrapper create/revise para mensagens de erro consistentes (já fornecidas pela versão otimizada)
  const create = base.create;
  const revise = base.revise;

  // Estados mapeados para manter paridade de nomes
  return {
    loading: base.loading,
    error: (base.error as any)?.message || null,
    plans: base.plans,
    load,
    getDetail: base.getDetail,
    create,
    creating: base.creating,
    revise,
    revising: base.revising || null,
    updateMeta,
  };
}
