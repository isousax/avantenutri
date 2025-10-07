import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '../config/api';
import { useAuth } from '../contexts';

// Tipos reutilizados do hook antigo (poderíamos importar de useWeightLogs.ts, mas para isolar o novo caminho guardamos aqui)
export interface WeightLog { id: string; log_date: string; weight_kg: number; note?: string | null; created_at: string; updated_at: string; }
interface ListResponse { ok?: boolean; results?: WeightLog[]; range?: { from: string; to: string }; error?: string; }
interface SummaryPoint { date: string; weight_kg: number; }
interface SummaryStats { first: SummaryPoint; latest: SummaryPoint; diff_kg: number; diff_percent: number | null; min: SummaryPoint; max: SummaryPoint; trend_slope: number; weight_goal_kg?: number | null; }
interface SummaryResponse { ok?: boolean; range?: { from: string; to: string }; series?: SummaryPoint[]; stats?: SummaryStats | null; error?: string; }

// Key helpers
const weightLogsKey = (days: number) => ['weight','logs',{days}] as const;
const weightSummaryKey = (days: number) => ['weight','summary',{days}] as const;

function buildRange(days:number) {
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const pad = (n:number)=> String(n).padStart(2,'0');
  const fmt = (d:Date)=> `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
  return { from: fmt(start), to: fmt(today) };
}

export function useWeightData(days = 30) {
  const { authenticatedFetch } = useAuth();
  const qc = useQueryClient();
  const range = buildRange(days);

  const logsQuery = useQuery({
    queryKey: weightLogsKey(days),
    queryFn: async (): Promise<{ logs: WeightLog[]; range?: {from:string; to:string} }> => {
      const r = await authenticatedFetch(`${API.WEIGHT_LOGS}?from=${range.from}&to=${range.to}`);
      const data: ListResponse = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao carregar peso');
      return { logs: data.results || [], range: data.range };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: (q) => q.state.data == null,
    placeholderData: (prev) => prev,
  });

  const summaryQuery = useQuery({
    queryKey: weightSummaryKey(days),
    queryFn: async (): Promise<SummaryResponse> => {
      const r = await authenticatedFetch(`${API.WEIGHT_SUMMARY}?days=${days}`);
      const data: SummaryResponse = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao obter resumo');
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: (q) => q.state.data == null,
    placeholderData: (prev) => prev,
  });

  const invalidate = () => {
    // Invalidate all queries that start with the 'weight' root key regardless of days
    qc.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && (q.queryKey as unknown as any[])[0] === 'weight' });
    // Refetch each unique matching queryKey once (including inactive queries)
    try {
      const all = qc.getQueryCache().getAll();
      const seen = new Set<string>();
      for (const q of all) {
        const k = q.queryKey;
        if (Array.isArray(k) && (k as unknown as any[])[0] === 'weight') {
          const keyStr = JSON.stringify(k);
          if (!seen.has(keyStr)) {
            seen.add(keyStr);
            // refetch by explicit key (ensures single call per key)
            qc.refetchQueries({ queryKey: k as any });
          }
        }
      }
    } catch {
      // ignore errors and rely on predicate fallback
    }
  };

  const upsertMutation = useMutation({
      mutationFn: async (payload: { weight_kg: number; note?: string; date?: string }) => {
      const body: any = { weight_kg: payload.weight_kg };
      if (payload.note) body.note = payload.note;
      if (payload.date) body.date = payload.date;
      const r = await authenticatedFetch(API.WEIGHT_LOGS, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
      const data = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Erro ao registrar peso');
      return data;
    },
  onMutate: async (payload) => {
        await qc.cancelQueries({ queryKey: ['weight'] });
  const prevLogs = qc.getQueryData<{ logs: WeightLog[]; range?: { from:string; to:string } } | undefined>(weightLogsKey(days));
  const prevSummary = qc.getQueryData<SummaryResponse | undefined>(weightSummaryKey(days));
        const optimisticId = `optimistic-${Date.now()}`;
        const today = new Date();
        const pad = (n:number)=> String(n).padStart(2,'0');
        const log_date = `${today.getUTCFullYear()}-${pad(today.getUTCMonth()+1)}-${pad(today.getUTCDate())}`;
        const newLog = { id: optimisticId, log_date, weight_kg: payload.weight_kg, note: payload.note || null, created_at: today.toISOString(), updated_at: today.toISOString() };
        if (prevLogs?.logs) {
          qc.setQueryData(weightLogsKey(days), { ...prevLogs, logs: [...prevLogs.logs.filter((l)=>!l.id.startsWith('optimistic-')), newLog] });
        }
        if (prevSummary?.stats?.latest) {
          qc.setQueryData(weightSummaryKey(days), { ...prevSummary, stats: { ...prevSummary.stats, latest: { date: log_date, weight_kg: payload.weight_kg } } });
        }
        return { prevLogs, prevSummary };
      },
      onSuccess: (res: unknown) => {
        try {
          // Try to extract a created log from common response shapes
          const r = res as Record<string, any> | null;
          const created = r && (r.result || (Array.isArray(r.results) && r.results[0]) || r.data || r.log || r);
          if (created && created.id) {
            // Replace optimistic entry in logs
            const cur = qc.getQueryData<{ logs: WeightLog[]; range?: { from: string; to: string } } | undefined>(weightLogsKey(days));
            if (cur?.logs) {
              const withoutOptimistic = cur.logs.filter((l) => !String(l.id).startsWith('optimistic-'));
              // avoid duplicates
              const exists = withoutOptimistic.some((l) => l.id === created.id);
              const newLogs = exists ? withoutOptimistic : [...withoutOptimistic, created as WeightLog];
              qc.setQueryData(weightLogsKey(days), { ...cur, logs: newLogs });
            }

            // Update summary latest if present
            const sum = qc.getQueryData<SummaryResponse | undefined>(weightSummaryKey(days));
            if (sum?.stats) {
              // normalize date string
              const createdDate = created.log_date ?? created.date ?? (created.created_at ? created.created_at.slice(0,10) : undefined);
              const weightVal = created.weight_kg ?? created.weight ?? created.weightKg;
              const updatedStats = { ...sum.stats, latest: { date: createdDate || sum.stats.latest.date, weight_kg: weightVal ?? sum.stats.latest.weight_kg } } as SummaryStats;
              qc.setQueryData(weightSummaryKey(days), { ...sum, stats: updatedStats });
            }
            return;
          }
        } catch {
          // ignore and fallback to invalidate
        }
        // fallback: invalidate to ensure fresh data
        invalidate();
        // also attempt explicit refetch of the common keys (best-effort)
  try { qc.refetchQueries({ queryKey: weightSummaryKey(days) }); qc.refetchQueries({ queryKey: weightLogsKey(days) }); } catch { /* ignore */ };
      },
      onError: (_err, _vars, ctx) => {
        if (ctx?.prevLogs) qc.setQueryData(weightLogsKey(days), ctx.prevLogs);
        if (ctx?.prevSummary) qc.setQueryData(weightSummaryKey(days), ctx.prevSummary);
      },
      onSettled: () => invalidate(),
  });

  const patchMutation = useMutation({
    mutationFn: async (args: { date: string; data: { weight_kg?: number; note?: string | null } }) => {
      const r = await authenticatedFetch(API.weightLogDate(args.date), { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(args.data) });
      const data = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Erro ao editar');
      return data;
    },
    onSuccess: () => invalidate(),
  });

  const goalMutation = useMutation({
    mutationFn: async (goal: number | null) => {
      const r = await authenticatedFetch(API.WEIGHT_GOAL, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ weight_goal_kg: goal }) });
      const data = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Erro ao salvar meta');
      return data;
    },
    onMutate: async (newGoal) => {
      await qc.cancelQueries({ queryKey: ['weight'] });
  const prevSummary = qc.getQueryData<SummaryResponse | undefined>(weightSummaryKey(days));
      if (prevSummary?.stats) {
        qc.setQueryData(weightSummaryKey(days), { ...prevSummary, stats: { ...prevSummary.stats, weight_goal_kg: newGoal } });
      }
      return { prevSummary };
    },
    onError: (_e,_v,ctx) => {
      if (ctx?.prevSummary) qc.setQueryData(weightSummaryKey(days), ctx.prevSummary);
    },
    onSettled: () => invalidate(),
  });

  const stats = summaryQuery.data?.stats;
  return {
    days,
    range: logsQuery.data?.range,
    logs: logsQuery.data?.logs || [],
    summary: summaryQuery.data,
    loading: logsQuery.isLoading || summaryQuery.isLoading,
    error: logsQuery.error || summaryQuery.error,
    latest: stats?.latest || null,
    diff_kg: stats?.diff_kg ?? null,
    diff_percent: stats?.diff_percent ?? null,
    trend_slope: stats?.trend_slope ?? null,
    goal: stats?.weight_goal_kg ?? null,
    series: summaryQuery.data?.series || [],
    refetch: () => { logsQuery.refetch(); summaryQuery.refetch(); },
    upsert: upsertMutation.mutateAsync,
    patch: patchMutation.mutateAsync,
    setGoal: goalMutation.mutateAsync,
    mutations: { upsertMutation, patchMutation, goalMutation },
  };
}

export function prefetchWeightData(qc: ReturnType<typeof useQueryClient>, days = 30, fetcher: (input: RequestInfo, init?: RequestInit)=>Promise<Response>) {
  const r = buildRange(days);
  qc.prefetchQuery({
    queryKey: weightLogsKey(days),
    queryFn: async () => {
      const res = await fetcher(`${API.WEIGHT_LOGS}?from=${r.from}&to=${r.to}`);
      const data: ListResponse = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.error || 'Falha ao carregar peso');
      return { logs: data.results || [], range: data.range };
    }
  });
  qc.prefetchQuery({
    queryKey: weightSummaryKey(days),
    queryFn: async () => {
      const res = await fetcher(`${API.WEIGHT_SUMMARY}?days=${days}`);
      const data: SummaryResponse = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.error || 'Falha ao obter resumo');
      return data;
    }
  });
}
