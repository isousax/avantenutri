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
    qc.invalidateQueries({ queryKey: ['weight'] });
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
        const prevLogs = qc.getQueryData<any>(weightLogsKey(days));
        const prevSummary = qc.getQueryData<any>(weightSummaryKey(days));
        const optimisticId = `optimistic-${Date.now()}`;
        const today = new Date();
        const pad = (n:number)=> String(n).padStart(2,'0');
        const log_date = `${today.getUTCFullYear()}-${pad(today.getUTCMonth()+1)}-${pad(today.getUTCDate())}`;
        const newLog = { id: optimisticId, log_date, weight_kg: payload.weight_kg, note: payload.note || null, created_at: today.toISOString(), updated_at: today.toISOString() };
        if (prevLogs?.logs) {
          qc.setQueryData(weightLogsKey(days), { ...prevLogs, logs: [...prevLogs.logs.filter((l:any)=>!l.id.startsWith('optimistic-')), newLog] });
        }
        if (prevSummary?.stats?.latest) {
          qc.setQueryData(weightSummaryKey(days), { ...prevSummary, stats: { ...prevSummary.stats, latest: { date: log_date, weight_kg: payload.weight_kg } } });
        }
        return { prevLogs, prevSummary };
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
      const prevSummary = qc.getQueryData<any>(weightSummaryKey(days));
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
