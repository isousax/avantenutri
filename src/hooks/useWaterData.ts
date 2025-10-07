import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "../config/api";
import { useAuth } from "../contexts";

interface WaterLog {
  id: string;
  log_date: string;
  amount_ml: number;
  created_at: string;
}
interface ListResponse {
  ok?: boolean;
  results?: WaterLog[];
  range?: { from: string; to: string };
  error?: string;
}
interface SummaryDay {
  date: string;
  total_ml: number;
}
interface SummaryResponse {
  ok?: boolean;
  range?: { from: string; to: string };
  days?: SummaryDay[];
  stats?: {
    avg: number;
    best: { date: string; total_ml: number } | null;
    today: { date: string; total_ml: number };
    limit: number | null;
    daily_cups?: number | null;
    cup_ml?: number | null;
  };
  error?: string;
}
interface GoalResponse {
  ok?: boolean;
  daily_cups?: number;
  cup_ml?: number;
  source?: string;
  error?: string;
}

const waterLogsKey = (days: number) => ["water", "logs", { days }] as const;
const waterSummaryKey = (days: number) =>
  ["water", "summary", { days }] as const;

function buildRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { from: fmt(start), to: fmt(end) };
}

export function useWaterData(days = 7) {
  const { authenticatedFetch } = useAuth();
  const qc = useQueryClient();
  const range = buildRange(days);

  const logsQuery = useQuery({
    queryKey: waterLogsKey(days),
    queryFn: async (): Promise<{
      logs: WaterLog[];
      range?: { from: string; to: string };
    }> => {
      const r = await authenticatedFetch(
        `${API.WATER_LOGS}?from=${range.from}&to=${range.to}`
      );
      const data: ListResponse = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Falha ao carregar registros");
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
    queryKey: waterSummaryKey(days),
    queryFn: async (): Promise<SummaryResponse> => {
      const r = await authenticatedFetch(`${API.WATER_SUMMARY}?days=${days}`);
      const data: SummaryResponse = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Falha ao carregar resumo");
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: (q) => q.state.data == null,
    placeholderData: (prev) => prev,
  });

  // If cached data corresponds to a previous date range (user opens app on a new day
  // or after many days), we should refetch to show the current (possibly zero) day.
  // We compare the 'to' range (logs) and the summary.stats.today.date when available.
  useEffect(() => {
    try {
      const pad = (n: number) => String(n).padStart(2, "0");
      const d = new Date();
      const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate()
      )}`;

      const logsRangeTo = logsQuery.data?.range?.to;
      const summaryToday = summaryQuery.data?.stats?.today?.date;

      const needsRefetch =
        (logsRangeTo && logsRangeTo !== today) ||
        (summaryToday && summaryToday !== today);
      if (needsRefetch) {
        // use the queries' refetch to update data for the current day
        logsQuery.refetch();
        summaryQuery.refetch();
      }
    } catch {
      // swallow errors silently; not critical
    }
    // run once on mount or when cached data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    logsQuery.data?.range?.to,
    summaryQuery.data?.stats?.today?.date,
    logsQuery.refetch,
    summaryQuery.refetch,
  ]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["water"] });

  const addMutation = useMutation({
    mutationFn: async (amount_ml: number) => {
      const r = await authenticatedFetch(API.WATER_LOGS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_ml }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Falha ao registrar");
      return data;
    },
    onMutate: async (amount_ml) => {
      await qc.cancelQueries({ queryKey: ["water"] });
      const prevLogs = qc.getQueryData<
        { logs: WaterLog[]; range?: { from: string; to: string } } | undefined
      >(waterLogsKey(days));
      const prevSummary = qc.getQueryData<SummaryResponse | undefined>(
        waterSummaryKey(days)
      );
      const optimisticId = `optimistic-${Date.now()}`;
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const log_date = `${now.getFullYear()}-${pad(
        now.getMonth() + 1
      )}-${pad(now.getDate())}`;
      const newLog = {
        id: optimisticId,
        log_date,
        amount_ml,
        created_at: now.toISOString(),
      };
      if (prevLogs?.logs) {
        qc.setQueryData(waterLogsKey(days), {
          ...prevLogs,
          logs: [
            ...prevLogs.logs.filter((l) => !l.id.startsWith("optimistic-")),
            newLog,
          ],
        });
      }
      // Update summary today total
      if (prevSummary?.stats) {
        const updated = { ...prevSummary.stats };
        if (updated.today) updated.today.total_ml += amount_ml;
        else updated.today = { date: log_date, total_ml: amount_ml };
        qc.setQueryData(waterSummaryKey(days), {
          ...prevSummary,
          stats: updated,
        });
      }
      return { prevLogs, prevSummary };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevLogs) qc.setQueryData(waterLogsKey(days), ctx.prevLogs);
      if (ctx?.prevSummary)
        qc.setQueryData(waterSummaryKey(days), ctx.prevSummary);
    },
    onSettled: () => invalidate(),
  });

  const updateGoalMutation = useMutation({
    mutationFn: async (cups: number) => {
      const r = await authenticatedFetch(API.WATER_GOAL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daily_cups: cups }),
      });
      const data: GoalResponse = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Falha ao atualizar meta");
      return data;
    },
    onSuccess: () => invalidate(),
  });

  const updateCupSizeMutation = useMutation({
    mutationFn: async (cup_ml: number) => {
      const r = await authenticatedFetch(API.WATER_SETTINGS, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cup_ml }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Falha ao atualizar copo");
      return data;
    },
    onSuccess: () => invalidate(),
  });

  const stats = summaryQuery.data?.stats;
  const today = (() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}`;
  })();
  const totalToday =
    stats?.today?.total_ml ??
    (logsQuery.data?.logs || [])
      .filter((l) => l.log_date === today)
      .reduce((s, l) => s + l.amount_ml, 0);
  const avgPerDay = stats?.avg ?? 0;
  const bestDay = stats?.best
    ? { date: stats.best.date, amount: stats.best.total_ml }
    : null;
  const limit = stats?.limit ?? null;
  const remaining = limit == null ? null : Math.max(0, limit - totalToday);

  return {
    days,
    range: logsQuery.data?.range,
    logs: logsQuery.data?.logs || [],
    summaryDays: summaryQuery.data?.days,
    loading: logsQuery.isLoading || summaryQuery.isLoading,
    error: logsQuery.error || summaryQuery.error,
    totalToday,
    avgPerDay,
    bestDay,
    limit,
    remaining,
    dailyGoalCups: stats?.daily_cups ?? null,
    cupSize: stats?.cup_ml ?? 250,
    add: addMutation.mutateAsync,
    updateGoal: updateGoalMutation.mutateAsync,
    updateCupSize: updateCupSizeMutation.mutateAsync,
    mutations: { addMutation, updateGoalMutation, updateCupSizeMutation },
    refetch: () => {
      logsQuery.refetch();
      summaryQuery.refetch();
    },
  };
}

// Prefetch helpers (para navegação antecipada / hover)
export function prefetchWaterData(
  qc: ReturnType<typeof useQueryClient>,
  days = 7,
  fetcher: (input: RequestInfo, init?: RequestInit) => Promise<Response>
) {
  const range = (() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate()
      )}`;
    return { from: fmt(start), to: fmt(end) };
  })();
  qc.prefetchQuery({
    queryKey: ["water", "logs", { days }],
    queryFn: async () => {
      const r = await fetcher(
        `${API.WATER_LOGS}?from=${range.from}&to=${range.to}`
      );
      const data: ListResponse = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Falha ao carregar registros");
      return { logs: data.results || [], range: data.range };
    },
  });
  qc.prefetchQuery({
    queryKey: ["water", "summary", { days }],
    queryFn: async () => {
      const r = await fetcher(`${API.WATER_SUMMARY}?days=${days}`);
      const data: SummaryResponse = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Falha ao carregar resumo");
      return data;
    },
  });
}
