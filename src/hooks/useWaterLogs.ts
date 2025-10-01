/**
 * LEGACY: Substituído por useWaterData (React Query).
 * Mantido temporariamente para compatibilidade. Evitar novos usos.
 */
import { useCallback, useEffect, useState } from 'react';
import { API } from '../config/api';
import { useAuth } from '../contexts';

export interface WaterLog {
  id: string;
  log_date: string; // YYYY-MM-DD
  amount_ml: number;
  created_at: string;
}

interface ListResponse { ok?: boolean; results?: WaterLog[]; range?: { from: string; to: string }; error?: string; }
interface SummaryDay { date: string; total_ml: number; }
interface SummaryResponse { ok?: boolean; range?: { from: string; to: string }; days?: SummaryDay[]; stats?: { avg: number; best: { date: string; total_ml: number } | null; today: { date: string; total_ml: number }; limit: number | null; daily_cups?: number | null; cup_ml?: number | null }; error?: string; }
interface GoalResponse { ok?: boolean; daily_cups?: number; cup_ml?: number; source?: string; error?: string; }

export function useWaterLogs(initialDays = 7) {
  const { authenticatedFetch } = useAuth();
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [dailyGoalCups, setDailyGoalCups] = useState<number | null>(null);
  const [goalSource, setGoalSource] = useState<string | null>(null);
  const [cupSize, setCupSize] = useState<number>(250);

  const load = useCallback(async (days = initialDays) => {
    setLoading(true); setError(null);
    try {
      const end = new Date();
      const start = new Date();
      start.setUTCDate(start.getUTCDate() - (days - 1));
      const pad = (n:number)=> String(n).padStart(2,'0');
      const fmt = (d:Date)=> `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
      const fromStr = fmt(start); const toStr = fmt(end);
      const cacheKey = `water:${fromStr}:${toStr}`;
      const cacheSummaryKey = `water:summary:${days}`;
      // Try cache (sessionStorage) fast path
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (raw) {
          const parsed: ListResponse & { ts?: number } = JSON.parse(raw);
          if (parsed.results && Array.isArray(parsed.results)) {
            setLogs(parsed.results);
            if (parsed.range) setRange(parsed.range);
          }
        }
        const rawSum = sessionStorage.getItem(cacheSummaryKey);
        if (rawSum) {
          const parsed: SummaryResponse & { ts?: number } = JSON.parse(rawSum);
          if (parsed.ok) setSummary(parsed);
        }
      } catch { /* ignore cache errors */ }
      const r = await authenticatedFetch(`${API.WATER_LOGS}?from=${fromStr}&to=${toStr}`, { method: 'GET' });
      const data: ListResponse = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao carregar registros');
      setLogs(data.results || []);
      if (data.range) setRange(data.range);
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ ...data, ts: Date.now() })); } catch { /* ignore */ }
      // summary
      const sr = await authenticatedFetch(`${API.WATER_SUMMARY}?days=${days}`, { method: 'GET' });
      const sdata: SummaryResponse = await sr.json().catch(()=>({}));
      if (sr.ok) { setSummary(sdata); try { sessionStorage.setItem(cacheSummaryKey, JSON.stringify({ ...sdata, ts: Date.now() })); } catch {/* ignore */} } else setSummary(null);
      // goal: prefer embedded summary stats.daily_cups else fetch dedicated endpoint
      let cups: number | null | undefined = sdata?.stats?.daily_cups;
      if (sdata?.stats?.cup_ml) setCupSize(sdata.stats.cup_ml);
      if (cups == null) {
        try {
          const gr = await authenticatedFetch(API.WATER_GOAL, { method: 'GET' });
          const gdata: GoalResponse = await gr.json().catch(()=>({}));
          if (gr.ok && gdata.daily_cups) { cups = gdata.daily_cups; setGoalSource(gdata.source || null); if (gdata.cup_ml) setCupSize(gdata.cup_ml); }
        } catch { /* ignore */ }
      }
      if (cups != null) setDailyGoalCups(cups);
    } catch (e:any) { setError(e.message || 'Erro'); }
    finally { setLoading(false); }
  }, [authenticatedFetch, initialDays]);

  const add = useCallback(async (amount_ml: number) => {
    setError(null);
    try {
      // If aggregate flag is true, send as single entry with total amount_ml
      const r = await authenticatedFetch(API.WATER_LOGS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount_ml }) });
      const data = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao registrar');
      await load();
      return true;
    } catch (e:any) { setError(e.message || 'Erro'); return false; }
  }, [authenticatedFetch, load]);

  useEffect(()=> { void load(initialDays); }, [initialDays]); // Removido 'load' para evitar loops

  // Agregações simples
  const today = (()=> {
    const pad = (n:number)=> String(n).padStart(2,'0');
    const d = new Date();
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
  })();
  const totalToday = summary?.stats?.today.total_ml ?? logs.filter(l => l.log_date === today).reduce((s,l)=> s + l.amount_ml, 0);
  const avg = summary?.stats?.avg ?? 0;
  const bestDay = summary?.stats?.best ? { date: summary.stats.best.date, amount: summary.stats.best.total_ml } : null;
  const limit = summary?.stats?.limit ?? null;
  const remaining = limit == null ? null : Math.max(0, limit - totalToday);
  const updateGoal = useCallback(async (cups: number) => {
    try {
      const r = await authenticatedFetch(API.WATER_GOAL, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ daily_cups: cups }) });
      const data: GoalResponse = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao atualizar meta');
      setDailyGoalCups(data.daily_cups ?? cups);
      setGoalSource('user');
      return true;
    } catch (e:any) { setError(e.message || 'Erro'); return false; }
  }, [authenticatedFetch]);

  const updateCupSize = useCallback(async (newSize: number) => {
    try {
      const r = await authenticatedFetch(API.WATER_SETTINGS, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cup_ml: newSize }) });
      const data = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao atualizar tamanho do copo');
      setCupSize(data.cup_ml || newSize);
      // Recarrega para recalcular agregados com novo cup size
      await load();
      return true;
    } catch (e:any) { setError(e.message || 'Erro'); return false; }
  }, [authenticatedFetch, load]);

  return { logs, loading, error, range, load, add, totalToday, avgPerDay: avg, bestDay, limit, remaining, summaryDays: summary?.days, dailyGoalCups, goalSource, cupSize, updateGoal, updateCupSize };
}
