import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '../config/api';
import { useAuth } from '../contexts';

interface MealLog { id: string; log_datetime: string; log_date: string; meal_type: string; description?: string|null; calories?: number|null; protein_g?: number|null; carbs_g?: number|null; fat_g?: number|null; created_at: string; updated_at: string; }
interface ListResponse { ok?: boolean; results?: MealLog[]; range?: { from: string; to: string }; error?: string; }
interface SummaryDay { date: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; count: number; }
interface SummaryStats { totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; avgCalories: number; }
interface Goals { calories: number|null; protein_g: number|null; carbs_g: number|null; fat_g: number|null; }
interface SummaryResponse { ok?: boolean; range?: { from: string; to: string }; days?: SummaryDay[]; stats?: SummaryStats | null; goals?: Goals; error?: string; }

const mealLogsKey = (days:number) => ['meals','logs',{days}] as const;
const mealSummaryKey = (days:number) => ['meals','summary',{days}] as const;

function buildRange(days:number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const pad = (n:number)=> String(n).padStart(2,'0');
  const fmt = (d:Date)=> `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  return { from: fmt(start), to: fmt(end) };
}

export function useMealData(days = 7) {
  const { authenticatedFetch } = useAuth();
  const qc = useQueryClient();
  const range = buildRange(days);

  const logsQuery = useQuery({
    queryKey: mealLogsKey(days),
    queryFn: async (): Promise<{ logs: MealLog[]; range?: {from:string; to:string} }> => {
      const r = await authenticatedFetch(`${API.MEAL_LOGS}?from=${range.from}&to=${range.to}`);
      const data: ListResponse = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao carregar refeições');
      return { logs: data.results || [], range: data.range };
    },
    staleTime: 1000 * 60 * 5, // aumentar para reduzir flicker ao navegar
    gcTime: 1000 * 60 * 30, // manter por mais tempo na memória
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: (q) => q.state.data == null, // evita refetch se já temos cache
    placeholderData: (prev) => prev,
  });

  const summaryQuery = useQuery({
    queryKey: mealSummaryKey(days),
    queryFn: async (): Promise<SummaryResponse> => {
      const r = await authenticatedFetch(`${API.MEAL_SUMMARY}?days=${days}`);
      const data: SummaryResponse = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao carregar resumo');
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: (q) => q.state.data == null,
    placeholderData: (prev) => prev,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['meals'] });

  const createMutation = useMutation({
      mutationFn: async (input: { meal_type: string; description?: string; calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number; datetime?: string; }) => {
      const r = await authenticatedFetch(API.MEAL_LOGS, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(input) });
      const data = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Erro ao registrar');
      return data;
    },
      onMutate: async (input) => {
        await qc.cancelQueries({ queryKey: ['meals'] });
        const prevLogs = qc.getQueryData<any>(mealLogsKey(days));
        const prevSummary = qc.getQueryData<any>(mealSummaryKey(days));
        const optimisticId = `optimistic-${Date.now()}`;
        const dt = input.datetime ? new Date(input.datetime) : new Date();
        const pad = (n:number)=> String(n).padStart(2,'0');
        const log_date = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
        const newLog: MealLog = { id: optimisticId, log_datetime: dt.toISOString(), log_date, meal_type: input.meal_type, description: input.description || '', calories: input.calories || null, protein_g: input.protein_g || null, carbs_g: input.carbs_g || null, fat_g: input.fat_g || null, created_at: dt.toISOString(), updated_at: dt.toISOString() };
        if (prevLogs?.logs) qc.setQueryData(mealLogsKey(days), { ...prevLogs, logs: [...prevLogs.logs.filter((l:any)=>!l.id.startsWith('optimistic-')), newLog] });
        if (prevSummary?.days) {
          const dayEntry = prevSummary.days.find((d:any)=> d.date === log_date);
          if (dayEntry) {
            if (newLog.calories) dayEntry.calories += newLog.calories;
            if (newLog.protein_g) dayEntry.protein_g += newLog.protein_g;
            if (newLog.carbs_g) dayEntry.carbs_g += newLog.carbs_g;
            if (newLog.fat_g) dayEntry.fat_g += newLog.fat_g;
            dayEntry.count += 1;
          } else {
            prevSummary.days.push({ date: log_date, calories: newLog.calories||0, protein_g: newLog.protein_g||0, carbs_g: newLog.carbs_g||0, fat_g: newLog.fat_g||0, count: 1 });
          }
          qc.setQueryData(mealSummaryKey(days), { ...prevSummary });
        }
        return { prevLogs, prevSummary };
      },
      onError: (_e,_v,ctx) => {
        if (ctx?.prevLogs) qc.setQueryData(mealLogsKey(days), ctx.prevLogs);
        if (ctx?.prevSummary) qc.setQueryData(mealSummaryKey(days), ctx.prevSummary);
      },
      onSettled: () => invalidate(),
  });

  const patchMutation = useMutation({
    mutationFn: async (args: { id: string; data: Partial<{ description: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; }> }) => {
      const r = await authenticatedFetch(API.mealLogId(args.id), { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(args.data) });
      const data = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Erro ao editar');
      return data;
    },
    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: ['meals'] });
      const prevLogs = qc.getQueryData<any>(mealLogsKey(days));
      const prevSummary = qc.getQueryData<any>(mealSummaryKey(days));
      let oldValues: any = null;
      if (prevLogs?.logs) {
        const updated = prevLogs.logs.map((l:any)=> {
          if (l.id === args.id) {
            oldValues = { calories: l.calories, protein_g: l.protein_g, carbs_g: l.carbs_g, fat_g: l.fat_g, log_date: l.log_date };
            return { ...l, ...args.data, updated_at: new Date().toISOString() };
          }
          return l;
        });
        qc.setQueryData(mealLogsKey(days), { ...prevLogs, logs: updated });
      }
      if (prevSummary?.days && oldValues) {
        const dayEntry = prevSummary.days.find((d:any)=> d.date === oldValues.log_date);
        if (dayEntry) {
          const dif = (field: 'calories'|'protein_g'|'carbs_g'|'fat_g') => {
            const newVal = (args.data as any)[field];
            if (newVal == null) return 0;
            const oldVal = (oldValues as any)[field] || 0;
            return (newVal - oldVal);
          };
          if ('calories' in args.data) dayEntry.calories += dif('calories');
          if ('protein_g' in args.data) dayEntry.protein_g += dif('protein_g');
          if ('carbs_g' in args.data) dayEntry.carbs_g += dif('carbs_g');
          if ('fat_g' in args.data) dayEntry.fat_g += dif('fat_g');
          // Recalcular stats básicos se existir
          if (prevSummary.stats) {
            const totalCals = prevSummary.days.reduce((s:any,d:any)=> s + d.calories,0);
            prevSummary.stats.totalCalories = totalCals;
          }
          qc.setQueryData(mealSummaryKey(days), { ...prevSummary });
        }
      }
      return { prevLogs, prevSummary };
    },
    onError: (_e,_v,ctx) => {
      if (ctx?.prevLogs) qc.setQueryData(mealLogsKey(days), ctx.prevLogs);
      if (ctx?.prevSummary) qc.setQueryData(mealSummaryKey(days), ctx.prevSummary);
    },
    onSettled: () => invalidate(),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await authenticatedFetch(API.mealLogId(id), { method: 'DELETE' });
      const data = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Erro ao excluir');
      return data;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['meals'] });
      const prevLogs = qc.getQueryData<any>(mealLogsKey(days));
      const prevSummary = qc.getQueryData<any>(mealSummaryKey(days));
      if (prevLogs?.logs) {
        qc.setQueryData(mealLogsKey(days), { ...prevLogs, logs: prevLogs.logs.filter((l:any)=> l.id !== id) });
      }
      return { prevLogs, prevSummary };
    },
    onError: (_e,_v,ctx) => {
      if (ctx?.prevLogs) qc.setQueryData(mealLogsKey(days), ctx.prevLogs);
      if (ctx?.prevSummary) qc.setQueryData(mealSummaryKey(days), ctx.prevSummary);
    },
    onSettled: () => invalidate(),
  });

  const goalsMutation = useMutation({
    mutationFn: async (goals: { calories_goal_kcal?: number|null; protein_goal_g?: number|null; carbs_goal_g?: number|null; fat_goal_g?: number|null; }) => {
      const r = await authenticatedFetch(API.MEAL_GOALS, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(goals) });
      const data = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Erro ao salvar metas');
      return data;
    },
    onSuccess: () => invalidate(),
  });

  const summary = summaryQuery.data;
  const goals = summary?.goals || { calories: null, protein_g: null, carbs_g: null, fat_g: null };
  const todayStr = (()=> { const d=new Date(); const pad=(n:number)=> String(n).padStart(2,'0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; })();
  const todayAgg = (summary?.days||[]).find(d => d.date === todayStr);
  const progress = todayAgg && goals ? {
    calories: goals.calories ? Math.min(100, Math.round((todayAgg.calories / goals.calories)*100)) : null,
    protein_g: goals.protein_g ? Math.min(100, Math.round((todayAgg.protein_g / goals.protein_g)*100)) : null,
    carbs_g: goals.carbs_g ? Math.min(100, Math.round((todayAgg.carbs_g / goals.carbs_g)*100)) : null,
    fat_g: goals.fat_g ? Math.min(100, Math.round((todayAgg.fat_g / goals.fat_g)*100)) : null,
  } : { calories: null, protein_g: null, carbs_g: null, fat_g: null };

  return {
    days,
    range: logsQuery.data?.range,
    logs: logsQuery.data?.logs || [],
    summary,
    loading: logsQuery.isLoading || summaryQuery.isLoading,
    error: logsQuery.error || summaryQuery.error,
    goals,
    progress,
    stats: summary?.stats || null,
    create: createMutation.mutateAsync,
    patch: patchMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    setGoals: goalsMutation.mutateAsync,
    mutations: { createMutation, patchMutation, removeMutation, goalsMutation },
    refetch: () => { logsQuery.refetch(); summaryQuery.refetch(); },
  };
}

export function prefetchMealData(qc: ReturnType<typeof useQueryClient>, days = 7, fetcher: (input: RequestInfo, init?: RequestInit)=>Promise<Response>) {
  const range = (()=>{
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    const pad = (n:number)=> String(n).padStart(2,'0');
    const fmt = (d:Date)=> `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    return { from: fmt(start), to: fmt(end) };
  })();
  qc.prefetchQuery({
    queryKey: ['meals','logs',{days}],
    queryFn: async () => {
      const r = await fetcher(`${API.MEAL_LOGS}?from=${range.from}&to=${range.to}`);
      const data: ListResponse = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao carregar refeições');
      return { logs: data.results || [], range: data.range };
    }
  });
  qc.prefetchQuery({
    queryKey: ['meals','summary',{days}],
    queryFn: async () => {
      const r = await fetcher(`${API.MEAL_SUMMARY}?days=${days}`);
      const data: SummaryResponse = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao carregar resumo');
      return data;
    }
  });
}
