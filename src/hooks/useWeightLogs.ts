import { useCallback, useEffect, useState } from 'react';
import { API } from '../config/api';
import { useAuth } from '../contexts';
import { usePermissions } from './usePermissions';
import { CAPABILITIES } from '../types/capabilities';

export interface WeightLog { id: string; log_date: string; weight_kg: number; note?: string | null; created_at: string; updated_at: string; }
interface ListResponse { ok?: boolean; results?: WeightLog[]; range?: { from: string; to: string }; error?: string; }
interface SummaryPoint { date: string; weight_kg: number; }
interface SummaryStats { first: SummaryPoint; latest: SummaryPoint; diff_kg: number; diff_percent: number | null; min: SummaryPoint; max: SummaryPoint; trend_slope: number; weight_goal_kg?: number | null; }
interface SummaryResponse { ok?: boolean; range?: { from: string; to: string }; series?: SummaryPoint[]; stats?: SummaryStats | null; error?: string; }

export function useWeightLogs(defaultDays = 90) {
  const { authenticatedFetch } = useAuth();
  const { can, usage } = usePermissions();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);

  const load = useCallback(async (days = defaultDays) => {
    if (!can(CAPABILITIES.PESO_LOG)) { setLogs([]); setSummary(null); return; }
    setLoading(true); setError(null);
    try {
      const today = new Date();
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      start.setUTCDate(start.getUTCDate() - (days - 1));
      const pad = (n:number)=> String(n).padStart(2,'0');
      const fmt = (d:Date)=> `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
      const fromStr = fmt(start); const toStr = fmt(today);
      // list
      const r = await authenticatedFetch(`${API.WEIGHT_LOGS}?from=${fromStr}&to=${toStr}`);
      const data: ListResponse = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao carregar peso');
      setLogs(data.results || []); if (data.range) setRange(data.range);
      // summary
      const sr = await authenticatedFetch(`${API.WEIGHT_SUMMARY}?days=${days}`);
      const sdata: SummaryResponse = await sr.json().catch(()=>({}));
      if (sr.ok) setSummary(sdata); else setSummary(null);
    } catch (e:any) { setError(e.message || 'Erro'); }
    finally { setLoading(false); }
  }, [authenticatedFetch, can, defaultDays]);

  const upsert = useCallback(async (weight_kg: number, note?: string, date?: string) => {
    if (!can(CAPABILITIES.PESO_LOG)) throw new Error('Sem permissão');
    setError(null);
    const body: any = { weight_kg };
    if (note) body.note = note;
    if (date) body.date = date; // permite registrar peso em data específica (corrige confusão de fuso horário)
    const r = await authenticatedFetch(API.WEIGHT_LOGS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(data.error || 'Erro ao registrar peso');
    await load();
    return true;
  }, [authenticatedFetch, can, load]);

  const patch = useCallback(async (date: string, data: { weight_kg?: number; note?: string | null }) => {
    if (!can(CAPABILITIES.PESO_LOG)) throw new Error('Sem permissão');
    const r = await authenticatedFetch(API.weightLogDate(date), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const d = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(d.error || 'Erro ao editar');
    await load();
    return true;
  }, [authenticatedFetch, can, load]);

  const setGoal = useCallback(async (goal: number | null) => {
    if (!can(CAPABILITIES.PESO_LOG)) throw new Error('Sem permissão');
    const r = await authenticatedFetch(API.WEIGHT_GOAL, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weight_goal_kg: goal }) });
    const d = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(d.error || 'Erro ao salvar meta');
    await load();
    return d.weight_goal_kg as number | null;
  }, [authenticatedFetch, can, load]);

  useEffect(()=> { void load(defaultDays); }, [defaultDays]); // Removido 'load' para evitar loops

  const latest = summary?.stats?.latest || null;
  const diff_kg = summary?.stats?.diff_kg ?? null;
  const diff_percent = summary?.stats?.diff_percent ?? null;
  const trend_slope = summary?.stats?.trend_slope ?? null;

  return { logs, summary, loading, error, range, load, upsert, patch, setGoal, latest, diff_kg, diff_percent, trend_slope, goal: summary?.stats?.weight_goal_kg ?? null, series: summary?.series || [], usageWeight: usage?.PESO_ATUAL };
}
