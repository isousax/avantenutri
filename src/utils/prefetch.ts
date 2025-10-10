import { QueryClient } from '@tanstack/react-query';
import { prefetchWeightData } from '../hooks/useWeightData';
import { prefetchWaterData } from '../hooks/useWaterData';
import { prefetchMealData } from '../hooks/useMealData';
import { prefetchDietPlans, prefetchDietPlanDetail } from '../hooks/useDietPlansOptimized';
import { prefetchNotifications } from '../hooks/useNotifications';
import { prefetchBillingHistory } from '../hooks/useBillingHistory';

// Controle global simples de throttle por chave + métricas
const lastRun: Record<string, number> = {};
const COOLDOWN_MS = 1200; // evita disparos em excesso

interface PrefetchMetricsEntry { attempts: number; executed: number; skippedCooldown: number; skippedCache: number; }
interface PrefetchMetrics { attempts: number; executed: number; skippedCooldown: number; skippedCache: number; byKey: Record<string, PrefetchMetricsEntry>; }
const metrics: PrefetchMetrics = { attempts: 0, executed: 0, skippedCooldown: 0, skippedCache: 0, byKey: {} };
function ensureMetrics(key: string): PrefetchMetricsEntry { return metrics.byKey[key] || (metrics.byKey[key] = { attempts:0, executed:0, skippedCooldown:0, skippedCache:0 }); }
function markAttempt(k:string){ metrics.attempts++; ensureMetrics(k).attempts++; }
function markExec(k:string){ metrics.executed++; ensureMetrics(k).executed++; }
function markCooldown(k:string){ metrics.skippedCooldown++; ensureMetrics(k).skippedCooldown++; }
function markCache(k:string){ metrics.skippedCache++; ensureMetrics(k).skippedCache++; }

function shouldRun(key: string) {
  const now = Date.now();
  if (lastRun[key] && now - lastRun[key] < COOLDOWN_MS) return false;
  lastRun[key] = now;
  return true;
}

// Verifica se já existe dado (cache hit) - se sim, pula prefetch para economizar rede
function isCached(qc: QueryClient, key: unknown[], metricsKey?: string): boolean {
  const cached = qc.getQueryState(key) != null;
  if (cached && metricsKey) markCache(metricsKey);
  return cached; // basta ter state (mesmo stale) para não forçar prefetch imediato
}

export interface PrefetchCtx {
  qc: QueryClient;
  fetcher: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}

export const Prefetch = {
  overview(ctx: PrefetchCtx) {
    const mk = 'overview'; markAttempt(mk);
    if (!shouldRun(mk)) { markCooldown(mk); return; }
    if (!isCached(ctx.qc, ['weight','logs',{days:30}], mk)) { prefetchWeightData(ctx.qc, 30, ctx.fetcher); markExec(mk); }
    if (!isCached(ctx.qc, ['water','logs',{days:7}], mk)) { prefetchWaterData(ctx.qc, 7, ctx.fetcher); markExec(mk); }
    if (!isCached(ctx.qc, ['meals','logs',{days:7}], mk)) { prefetchMealData(ctx.qc, 7, ctx.fetcher); markExec(mk); }
    if (!isCached(ctx.qc, ['billing','payments'], mk)) { prefetchBillingHistory(ctx.qc, ctx.fetcher); markExec(mk); }
  },
  exercicios(ctx: PrefetchCtx) {
    const mk = 'exercicios'; markAttempt(mk);
    if (!shouldRun(mk)) { markCooldown(mk); return; }
    if (!isCached(ctx.qc, ['weight','logs',{days:90}], mk)) { prefetchWeightData(ctx.qc, 90, ctx.fetcher); markExec(mk); }
    if (!isCached(ctx.qc, ['meals','logs',{days:14}], mk)) { prefetchMealData(ctx.qc, 14, ctx.fetcher); markExec(mk); }
  },
  dietas(ctx: PrefetchCtx) {
    const mk = 'dietas'; markAttempt(mk);
    if (!shouldRun(mk)) { markCooldown(mk); return; }
    if (!isCached(ctx.qc, ['diet-plans', {}], mk)) { prefetchDietPlans(ctx.qc, ctx.fetcher); markExec(mk); }
  },
  dietPlanDetail(ctx: PrefetchCtx, id: string) {
    if (!id) return; const mk = `dietPlanDetail:${id}:deep`; markAttempt(mk);
    const key = ['diet-plan-detail', id];
    if (!shouldRun(key.join(':'))) { markCooldown(mk); return; }
    if (!isCached(ctx.qc, key, mk)) { prefetchDietPlanDetail(ctx.qc, ctx.fetcher, id); markExec(mk); }
  },
  notificacoes(ctx: PrefetchCtx) {
    const mk = 'notificacoes'; markAttempt(mk);
    if (!shouldRun(mk)) { markCooldown(mk); return; }
    if (!isCached(ctx.qc, ['notifications', true, 10, 0], mk)) { prefetchNotifications(ctx.qc, ctx.fetcher, { onlyUnread: true, limit: 10 }); markExec(mk); }
    if (!isCached(ctx.qc, ['notifications', false, 5, 0], mk)) { prefetchNotifications(ctx.qc, ctx.fetcher, { onlyUnread: false, limit: 5 }); markExec(mk); }
  },
  quickAction(ctx: PrefetchCtx, label: string) {
    const lower = label.toLowerCase(); const mk = `quick:${lower}`; markAttempt(mk);
    if (lower.includes('peso')) {
      if (!shouldRun('qa-peso')) { markCooldown(mk); } else if (!isCached(ctx.qc, ['weight','logs',{days:90}], mk)) { prefetchWeightData(ctx.qc, 90, ctx.fetcher); markExec(mk); }
    }
    if (lower.includes('água') || lower.includes('hidr')) {
      if (!shouldRun('qa-agua')) { markCooldown(mk); } else if (!isCached(ctx.qc, ['water','logs',{days:7}], mk)) { prefetchWaterData(ctx.qc, 7, ctx.fetcher); markExec(mk); }
    }
    if (lower.includes('refei')) {
      if (!shouldRun('qa-refeicao')) { markCooldown(mk); } else if (!isCached(ctx.qc, ['meals','logs',{days:7}], mk)) { prefetchMealData(ctx.qc, 7, ctx.fetcher); markExec(mk); }
    }
  }
};

export function getPrefetchMetrics(){ return metrics; }
export function logPrefetchMetrics(){
  console.log('[Prefetch Metrics]', metrics);
}
if (typeof window !== 'undefined' && (import.meta as ImportMeta).env?.DEV) {
  (window as unknown as { __PREFETCH_METRICS__?: PrefetchMetrics }).__PREFETCH_METRICS__ = metrics;
}

export default Prefetch;