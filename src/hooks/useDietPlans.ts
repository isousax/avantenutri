import { useCallback, useState } from 'react';
import { API } from '../config/api';
import { useAuth } from '../contexts';
import { usePermissions } from './usePermissions';
import { CAPABILITIES } from '../types/capabilities';

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

interface ListResponse { ok?: boolean; results?: DietPlanSummary[]; error?: string; }
interface DetailResponse { ok?: boolean; plan?: DietPlanDetail; error?: string; }
interface CreateResponse { ok?: boolean; plan_id?: string; version_id?: string; error?: string; }
interface ReviseResponse { ok?: boolean; plan_id?: string; version_id?: string; version_number?: number; error?: string; }

export function useDietPlans() {
  const { authenticatedFetch } = useAuth();
  const { can } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<DietPlanSummary[]>([]);
  const [detailCache, setDetailCache] = useState<Record<string, DietPlanDetail>>({});
  const [creating, setCreating] = useState(false);
  const [revising, setRevising] = useState<string | null>(null);

  const load = useCallback(async (opts: { archived?: boolean } = {}) => {
    if (!can(CAPABILITIES.DIETA_VIEW)) { setPlans([]); return; }
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams();
      if (opts.archived) qs.set('archived', '1');
      const r = await authenticatedFetch(`${API.DIET_PLANS}${qs.toString() ? '?' + qs.toString() : ''}`, { method: 'GET' });
      const data: ListResponse = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || `Erro HTTP ${r.status}`);
      setPlans(data.results || []);
    } catch (e:any) {
      setError(e.message || 'Erro ao carregar planos');
    } finally { setLoading(false); }
  }, [authenticatedFetch, can]);

  const getDetail = useCallback(async (id: string, includeData = false) => {
    if (detailCache[id] && (!includeData || detailCache[id].versions.every(v => v.data !== undefined))) {
      return detailCache[id];
    }
    try {
      const r = await authenticatedFetch(`${API.dietPlan(id)}${includeData ? '?includeData=1' : ''}`, { method: 'GET' });
      const data: DetailResponse = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao carregar plano');
      if (data.plan) {
        setDetailCache(dc => ({ ...dc, [id]: data.plan! }));
        return data.plan;
      }
      return null;
    } catch (e:any) {
      setError(e.message || 'Erro ao carregar detalhes');
      return null;
    }
  }, [authenticatedFetch, detailCache]);

  const create = useCallback(async (payload: { name: string; description?: string; start_date?: string; end_date?: string; data?: any; }) => {
    if (!can(CAPABILITIES.DIETA_EDIT)) throw new Error('Sem permissão');
    setCreating(true); setError(null);
    try {
      const r = await authenticatedFetch(API.DIET_PLANS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data: CreateResponse = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao criar plano');
      await load();
      return data.plan_id || null;
    } catch (e:any) {
      setError(e.message || 'Erro ao criar');
      return null;
    } finally { setCreating(false); }
  }, [authenticatedFetch, can, load]);

  const revise = useCallback(async (planId: string, payload: { notes?: string; dataPatch?: any; }) => {
    if (!can(CAPABILITIES.DIETA_EDIT)) throw new Error('Sem permissão');
    setRevising(planId); setError(null);
    try {
      const r = await authenticatedFetch(API.dietPlanRevise(planId), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data: ReviseResponse = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao revisar');
      await getDetail(planId, false); // refresh cache
      await load();
      return data.version_id || null;
    } catch (e:any) {
      setError(e.message || 'Erro ao revisar');
      return null;
    } finally { setRevising(null); }
  }, [authenticatedFetch, can, getDetail, load]);

  const updateMeta = useCallback(async (planId: string, payload: Partial<{ name: string; description: string; status: 'active'|'archived'; results_summary: string; start_date: string; end_date: string; }>) => {
    setError(null);
    try {
      const r = await authenticatedFetch(API.dietPlan(planId), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao atualizar');
      await getDetail(planId, false);
      await load();
      return true;
    } catch (e:any) { setError(e.message || 'Erro ao atualizar'); return false; }
  }, [authenticatedFetch, getDetail, load]);

  return { loading, error, plans, load, getDetail, create, creating, revise, revising, updateMeta, detailCache };
}
