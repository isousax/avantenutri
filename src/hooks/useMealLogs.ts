import { useCallback, useEffect, useState } from 'react';
import { API } from '../config/api';
import { useAuth } from '../contexts';

export interface MealLog { id: string; log_datetime: string; log_date: string; meal_type: string; description?: string|null; calories?: number|null; protein_g?: number|null; carbs_g?: number|null; fat_g?: number|null; created_at: string; updated_at: string; }
interface ListResponse { ok?: boolean; results?: MealLog[]; range?: { from: string; to: string }; error?: string; }
interface SummaryDay { date: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; count: number; }
interface SummaryStats { totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; avgCalories: number; }
interface Goals { calories: number|null; protein_g: number|null; carbs_g: number|null; fat_g: number|null; }
interface SummaryResponse { ok?: boolean; range?: { from: string; to: string }; days?: SummaryDay[]; stats?: SummaryStats | null; goals?: Goals; error?: string; }

export function useMealLogs(defaultDays = 7) {
  const { authenticatedFetch } = useAuth();
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);

  const load = useCallback(async (days = defaultDays) => {
    setLoading(true); setError(null);
    try {
      const end = new Date();
      const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
      start.setUTCDate(start.getUTCDate() - (days - 1));
      const pad = (n:number)=> String(n).padStart(2,'0');
      const fmt = (d:Date)=> `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
      const fromStr = fmt(start); const toStr = fmt(end);
      const r = await authenticatedFetch(`${API.MEAL_LOGS}?from=${fromStr}&to=${toStr}`);
      const data: ListResponse = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao carregar refeições');
      setLogs(data.results || []); if (data.range) setRange(data.range);
      const sr = await authenticatedFetch(`${API.MEAL_SUMMARY}?days=${days}`);
      const sdata: SummaryResponse = await sr.json().catch(()=>({}));
      if (sr.ok) setSummary(sdata); else setSummary(null);
    } catch (e:any) { setError(e.message || 'Erro'); }
    finally { setLoading(false); }
  }, [authenticatedFetch, defaultDays]);

  const create = useCallback(async (input: { meal_type: string; description?: string; calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number; datetime?: string; }) => {
    const r = await authenticatedFetch(API.MEAL_LOGS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    const data = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(data.error || 'Erro ao registrar');
    await load();
    return true;
  }, [authenticatedFetch, load]);

  useEffect(()=> { void load(defaultDays); }, [load, defaultDays]);

  const patch = useCallback(async (id: string, data: Partial<{ description: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; }>) => {
    const r = await authenticatedFetch(API.mealLogId(id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const d = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(d.error || 'Erro ao editar');
    await load();
    return true;
  }, [authenticatedFetch, load]);
  const remove = useCallback(async (id: string) => {
    const r = await authenticatedFetch(API.mealLogId(id), { method: 'DELETE' });
    const d = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(d.error || 'Erro ao excluir');
    await load();
    return true;
  }, [authenticatedFetch, load]);
  const setGoals = useCallback(async (goals: { calories_goal_kcal?: number|null; protein_goal_g?: number|null; carbs_goal_g?: number|null; fat_goal_g?: number|null; }) => {
    const r = await authenticatedFetch(API.MEAL_GOALS, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(goals) });
    const d = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(d.error || 'Erro ao salvar metas');
    await load();
    return d.goals;
  }, [authenticatedFetch, load]);
  const goals = summary?.goals || { calories: null, protein_g: null, carbs_g: null, fat_g: null };
  // progresso do dia atual (se existir no summary days ultima posição)
  const todayStr = (()=> { const d=new Date(); const pad=(n:number)=> String(n).padStart(2,'0'); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`; })();
  const todayAgg = (summary?.days||[]).find(d => d.date === todayStr);
  const progress = todayAgg && goals ? {
    calories: goals.calories ? Math.min(100, Math.round((todayAgg.calories / goals.calories)*100)) : null,
    protein_g: goals.protein_g ? Math.min(100, Math.round((todayAgg.protein_g / goals.protein_g)*100)) : null,
    carbs_g: goals.carbs_g ? Math.min(100, Math.round((todayAgg.carbs_g / goals.carbs_g)*100)) : null,
    fat_g: goals.fat_g ? Math.min(100, Math.round((todayAgg.fat_g / goals.fat_g)*100)) : null,
  } : { calories: null, protein_g: null, carbs_g: null, fat_g: null };
  return { logs, summary, loading, error, range, load, create, patch, remove, setGoals, goals, progress, days: summary?.days || [], stats: summary?.stats || null };
}
