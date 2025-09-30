import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../contexts';
import { API } from '../../../config/api';
import { useI18n } from '../../../i18n';
import { SEO } from '../../../components/comum/SEO';
import Skeleton from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/ToastProvider';

interface PaymentRow { id: string; plan_id: string; amount_cents: number; status: string; created_at: string; processed_at?: string; gateway_id?: string; }
interface PlanChangeRow { id: string; previous_plan_id: string|null; new_plan_id: string; created_at: string; trigger: string; payment_id?: string|null; }

interface ListPaymentsResp { payments: PaymentRow[] }
interface ListPlanChangesResp { changes: PlanChangeRow[] }

// Placeholder Webhook item (mock until backend endpoint exists)
interface WebhookDelivery { id: string; event: string; status: string; received_at: string; latency_ms?: number; attempts?: number; }

const AdminBillingPage: React.FC = () => {
  const { authenticatedFetch } = useAuth();
  const { push } = useToast();
  const { locale, t } = useI18n();
  const [view, setView] = useState<'payments' | 'planChanges' | 'webhooks' | 'summary'>('summary');
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [changes, setChanges] = useState<PlanChangeRow[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Filtros & paginação
  const [payStatus, setPayStatus] = useState<string>('');
  const [payPlan, setPayPlan] = useState<string>('');
  const [payPlanInput, setPayPlanInput] = useState<string>(''); // debounce input
  const [payPage, setPayPage] = useState(1);
  const [payHasMore, setPayHasMore] = useState(false);
  const [payStart, setPayStart] = useState<string>('');
  const [payEnd, setPayEnd] = useState<string>('');
  const [payTotal, setPayTotal] = useState<number | null>(null);
  const [chgPage, setChgPage] = useState(1);
  const [chgHasMore, setChgHasMore] = useState(false);
  const [chgTotal, setChgTotal] = useState<number | null>(null);
  const PAGE_SIZE = 20; // constante local
  const [searchParams, setSearchParams] = useSearchParams();
  const initializedRef = useRef(false);
  const [exportingPayments, setExportingPayments] = useState(false);
  const [exportingChanges, setExportingChanges] = useState(false);

  // Ler querystring inicial
  useEffect(() => {
    if (initializedRef.current) return;
    const qView = searchParams.get('view');
    if (qView === 'payments' || qView === 'planChanges' || qView === 'webhooks' || qView === 'summary') setView(qView);
    const qStatus = searchParams.get('status'); if (qStatus) setPayStatus(qStatus);
    const qPlan = searchParams.get('plan'); if (qPlan) { setPayPlan(qPlan); setPayPlanInput(qPlan); }
    const qPage = Number(searchParams.get('page')||'1'); if (qPage>1) setPayPage(qPage);
    const qs = searchParams.get('start'); if (qs) setPayStart(qs);
    const qe = searchParams.get('end'); if (qe) setPayEnd(qe);
    const qcPage = Number(searchParams.get('cpage')||'1'); if (qcPage>1) setChgPage(qcPage);
    initializedRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualizar querystring quando filtros mudarem
  useEffect(() => {
    if (!initializedRef.current) return; // evita sobrescrever inicial
    const params: Record<string,string> = {};
    params.view = view;
    if (payStatus) params.status = payStatus;
    if (payPlan) params.plan = payPlan;
    if (payPage>1) params.page = String(payPage);
    if (payStart) params.start = payStart;
    if (payEnd) params.end = payEnd;
    if (chgPage>1) params.cpage = String(chgPage);
    setSearchParams(params, { replace:true });
  }, [view, payStatus, payPlan, payPage, payStart, payEnd, chgPage, setSearchParams]);

  // Debounce campo plan_id
  useEffect(() => {
    const id = setTimeout(() => {
      setPayPlan(prev => prev === payPlanInput ? prev : payPlanInput);
      setPayPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [payPlanInput]);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const qs: Record<string,string> = { page: String(payPage), pageSize: String(PAGE_SIZE) };
      if (payStatus) qs.status = payStatus; if (payPlan) qs.plan_id = payPlan; if (payStart) qs.start = payStart; if (payEnd) qs.end = payEnd;
      const url = API.BILLING_PAYMENTS + '?' + new URLSearchParams(qs).toString();
      const r = await authenticatedFetch(url, { method:'GET', autoLogout:true });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const data: ListPaymentsResp = await r.json();
  setPayments(data.payments || []);
      const len = (data.payments || []).length;
      setPayHasMore(len === PAGE_SIZE); // heurística: se veio cheio supõe haver mais
      let total: number | null = null;
      const headerTotal = r.headers.get('X-Total-Count');
      if (headerTotal) { const n = Number(headerTotal); if (!isNaN(n)) total = n; }
      if ((data as any).total != null && typeof (data as any).total === 'number') total = (data as any).total;
      setPayTotal(total);
  } catch(e:any){ setError(e.message || 'Erro'); push({ type:'error', message: t('admin.billing.toast.loadPaymentsError') }); } finally { setLoading(false); }
  }, [authenticatedFetch, payStatus, payPlan, payPage, payStart, payEnd]);

  const loadChanges = useCallback( async () => {
    try {
      setLoading(true); setError(null);
      const qs: Record<string,string> = { page: String(chgPage), pageSize: String(PAGE_SIZE) };
      const url = API.BILLING_PLAN_CHANGES + '?' + new URLSearchParams(qs).toString();
      const r = await authenticatedFetch(url, { method:'GET', autoLogout:true });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const data: ListPlanChangesResp = await r.json();
  setChanges(data.changes || []);
      const len = (data.changes || []).length;
      setChgHasMore(len === PAGE_SIZE);
      let total: number | null = null;
      const headerTotal = r.headers.get('X-Total-Count');
      if (headerTotal) { const n = Number(headerTotal); if (!isNaN(n)) total = n; }
      if ((data as any).total != null && typeof (data as any).total === 'number') total = (data as any).total;
      setChgTotal(total);
  } catch(e:any){ setError(e.message || 'Erro'); push({ type:'error', message: t('admin.billing.toast.loadChangesError') }); } finally { setLoading(false); }
  }, [authenticatedFetch, chgPage]);

  const loadWebhooks = useCallback( async () => {
    // Mock temporário — substituir quando endpoint real existir
    setLoading(true); setError(null);
    try {
      await new Promise(r => setTimeout(r, 250));
      setWebhooks([
        { id:'wh_1', event:'payment.approved', status:'processed', received_at:new Date(Date.now()-3600_000).toISOString(), latency_ms:120, attempts:1 },
        { id:'wh_2', event:'payment.pending', status:'processed', received_at:new Date(Date.now()-7200_000).toISOString(), latency_ms:200, attempts:1 },
        { id:'wh_3', event:'payment.failed', status:'error', received_at:new Date(Date.now()-10800_000).toISOString(), latency_ms:350, attempts:2 },
      ]);
  } catch(e:any){ setError(e.message || 'Erro'); push({ type:'error', message: t('admin.billing.toast.loadWebhooksError') }); } finally { setLoading(false); }
  }, []);

  // Carregar conforme view ou mudança de filtros
  useEffect(()=> {
    if (view === 'payments') loadPayments();
  }, [view, loadPayments]);
  useEffect(()=> { if (view === 'planChanges') loadChanges(); }, [view, loadChanges]);
  useEffect(()=> { if (view === 'webhooks') loadWebhooks(); }, [view, loadWebhooks]);

  const currencyFmt = useCallback((cents: number) => new Intl.NumberFormat(locale==='pt'?'pt-BR':'en-US', { style:'currency', currency:'BRL' }).format(cents/100), [locale]);

  const summary = useMemo(() => {
    const totalApproved = payments.filter(p => p.status === 'approved').reduce((acc,p)=> acc + p.amount_cents, 0);
    const totalPending = payments.filter(p => p.status === 'pending').reduce((acc,p)=> acc + p.amount_cents, 0);
    const byPlan: Record<string, number> = {};
    payments.forEach(p => { if(!byPlan[p.plan_id]) byPlan[p.plan_id] = 0; byPlan[p.plan_id]+=1; });
    return { totalApproved, totalPending, byPlan };
  }, [payments]);

  const byPlanEntries = Object.entries(summary.byPlan).sort((a,b)=> b[1]-a[1]);

  // Util simples para gerar CSV
  function toCSV(rows: any[]): string {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[";,\n]/.test(s) ? '"'+s+'"' : s;
    };
    const lines = [headers.join(',')];
    for (const r of rows) lines.push(headers.map(h => escape((r as any)[h])).join(','));
    return lines.join('\n');
  }

  async function exportPaymentsCSV(){
    if (exportingPayments) return;
    setExportingPayments(true);
    try {
      const all: PaymentRow[] = [];
      const pageSize = 200; // maior para reduzir chamadas
      for (let page=1; page<=50; page++){ // hard cap safety
        const qs: Record<string,string> = { page: String(page), pageSize: String(pageSize) };
        if (payStatus) qs.status = payStatus; if (payPlan) qs.plan_id = payPlan; if (payStart) qs.start = payStart; if (payEnd) qs.end = payEnd;
        const url = API.BILLING_PAYMENTS + '?' + new URLSearchParams(qs).toString();
        const r = await authenticatedFetch(url, { method:'GET', autoLogout:true });
        if(!r.ok) throw new Error('HTTP '+r.status);
        const data: ListPaymentsResp = await r.json();
        const batch = data.payments || [];
        all.push(...batch);
        if (batch.length < pageSize) break; // último page
      }
      const csv = toCSV(all.map(p => ({
        id: p.id,
        plan_id: p.plan_id,
        amount_cents: p.amount_cents,
        amount_brl: (p.amount_cents/100).toFixed(2),
        status: p.status,
        created_at: p.created_at,
        processed_at: p.processed_at || ''
      })));
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
      const urlObj = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObj;
      const ts = new Date().toISOString().slice(0,10).replace(/-/g,'');
      a.download = `billing-payments-${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(()=> { URL.revokeObjectURL(urlObj); a.remove(); }, 0);
      push({ type:'success', message: t('admin.billing.toast.export.payments.success').replace('{count}', String(all.length)) });
    } catch(e:any){ setError(e.message || 'Erro export'); push({ type:'error', message: t('admin.billing.toast.export.payments.error') }); } finally { setExportingPayments(false); }
  }

  async function exportChangesCSV(){
    if (exportingChanges) return;
    setExportingChanges(true);
    try {
      const all: PlanChangeRow[] = [];
      const pageSize = 200;
      for (let page=1; page<=50; page++){
        const qs: Record<string,string> = { page: String(page), pageSize: String(pageSize) };
        const url = API.BILLING_PLAN_CHANGES + '?' + new URLSearchParams(qs).toString();
        const r = await authenticatedFetch(url, { method:'GET', autoLogout:true });
        if(!r.ok) throw new Error('HTTP '+r.status);
        const data: ListPlanChangesResp = await r.json();
        const batch = data.changes || [];
        all.push(...batch);
        if (batch.length < pageSize) break;
      }
      const csv = toCSV(all.map(c => ({
        id: c.id,
        previous_plan_id: c.previous_plan_id || '',
        new_plan_id: c.new_plan_id,
        trigger: c.trigger,
        payment_id: c.payment_id || '',
        created_at: c.created_at
      })));
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
      const urlObj = URL.createObjectURL(blob);
      const ts = new Date().toISOString().slice(0,10).replace(/-/g,'');
      const a = document.createElement('a');
      a.href = urlObj;
      a.download = `billing-planChanges-${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(()=> { URL.revokeObjectURL(urlObj); a.remove(); }, 0);
      push({ type:'success', message: t('admin.billing.toast.export.changes.success').replace('{count}', String(all.length)) });
    } catch(e:any){ setError(e.message || 'Erro export'); push({ type:'error', message: t('admin.billing.toast.export.changes.error') }); } finally { setExportingChanges(false); }
  }

  return (
    <div className="p-6 space-y-6">
      <SEO title={t('admin.billing.seo.title')} description={t('admin.billing.seo.desc')} />
      <div className="flex flex-wrap gap-3 items-center justify-between">
  <h1 className="text-2xl font-semibold">{t('admin.billing.title')}</h1>
        <div className="flex gap-2 flex-wrap">
          <Button type="button" variant={view==='summary'?'primary':'secondary'} onClick={()=> setView('summary')}>{t('admin.billing.view.summary')}</Button>
          <Button type="button" variant={view==='payments'?'primary':'secondary'} onClick={()=> setView('payments')}>{t('admin.billing.view.payments')}</Button>
          <Button type="button" variant={view==='planChanges'?'primary':'secondary'} onClick={()=> setView('planChanges')}>{t('admin.billing.view.planChanges')}</Button>
          <Button type="button" variant={view==='webhooks'?'primary':'secondary'} onClick={()=> setView('webhooks')}>{t('admin.billing.view.webhooks')}</Button>
        </div>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}

      {view==='summary' && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4 space-y-1">
            <div className="text-xs text-gray-500">{t('admin.billing.summary.revenueApproved')}</div>
            <div className="text-xl font-semibold">{loading ? <Skeleton className="h-6 w-24" /> : currencyFmt(summary.totalApproved)}</div>
          </Card>
            <Card className="p-4 space-y-1">
              <div className="text-xs text-gray-500">{t('admin.billing.summary.paymentsPending')}</div>
              <div className="text-xl font-semibold">{loading ? <Skeleton className="h-6 w-20" /> : currencyFmt(summary.totalPending)}</div>
            </Card>
            <Card className="p-4 space-y-1">
              <div className="text-xs text-gray-500">{t('admin.billing.summary.plansTop')}</div>
              {loading && <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-16" /></div>}
              {!loading && <ul className="text-xs space-y-1 max-h-28 overflow-auto">{byPlanEntries.length === 0 && <li className="text-gray-400">—</li>}{byPlanEntries.map(([plan, count])=> <li key={plan}><span className="font-mono">{plan}</span>: {count}</li>)}</ul>}
            </Card>
        </div>
      )}

      {view==='payments' && (
        <>
        <Card className="p-0 overflow-x-auto hidden md:block">
          <div className="p-3 flex flex-wrap gap-3 items-end border-b bg-white">
            <div>
              <label className="block text-[11px] font-medium mb-1">{t('admin.billing.filters.status')}</label>
              <select value={payStatus} onChange={e=> { setPayPage(1); setPayStatus(e.target.value); }} className="border rounded px-2 py-1 text-sm">
                <option value="">{t('admin.billing.status.all')}</option>
                <option value="approved">{t('admin.billing.status.approved')}</option>
                <option value="pending">{t('admin.billing.status.pending')}</option>
                <option value="failed">{t('admin.billing.status.failed')}</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1">{t('admin.billing.filters.plan')}</label>
              <input value={payPlanInput} onChange={e=> { setPayPlanInput(e.target.value); }} placeholder={t('admin.billing.filters.plan.placeholder')} className="border rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1">{t('admin.billing.filters.start')}</label>
              <input type="date" value={payStart} onChange={e=> { setPayStart(e.target.value); setPayPage(1); }} className="border rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1">{t('admin.billing.filters.end')}</label>
              <input type="date" value={payEnd} onChange={e=> { setPayEnd(e.target.value); setPayPage(1); }} className="border rounded px-2 py-1 text-sm" />
            </div>
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="secondary" disabled={loading} onClick={()=> { setPayPage(1); loadPayments(); }}>{t('admin.billing.filters.reload')}</Button>
              <Button type="button" variant="secondary" disabled={loading && !exportingPayments} onClick={exportPaymentsCSV}>{exportingPayments ? t('admin.billing.export.payments.inProgress') : t('admin.billing.export.payments')}</Button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">{t('admin.billing.table.payments.id')}</th>
                <th className="p-2">{t('admin.billing.table.payments.plan')}</th>
                <th className="p-2">{t('admin.billing.table.payments.amount')}</th>
                <th className="p-2">{t('admin.billing.table.payments.status')}</th>
                <th className="p-2">{t('admin.billing.table.payments.created')}</th>
                <th className="p-2">{t('admin.billing.table.payments.processed')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="p-4"><Skeleton lines={3} /></td></tr>}
              {!loading && payments.length===0 && <tr><td colSpan={6} className="p-4 text-sm text-gray-500">{t('admin.billing.table.payments.empty')}</td></tr>}
              {!loading && payments.map(p => (
                <tr key={p.id} className="border-b last:border-none hover:bg-gray-50">
                  <td className="p-2 font-mono text-xs select-all">{p.id}</td>
                  <td className="p-2 font-mono text-xs">{p.plan_id}</td>
                  <td className="p-2">{currencyFmt(p.amount_cents)}</td>
                  <td className="p-2 text-xs">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${p.status==='approved'?'bg-green-100 text-green-700': p.status==='pending'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{p.status}</span>
                  </td>
                  <td className="p-2 text-xs">{new Date(p.created_at).toLocaleString(locale==='pt'?'pt-BR':'en-US')}</td>
                  <td className="p-2 text-xs">{p.processed_at ? new Date(p.processed_at).toLocaleString(locale==='pt'?'pt-BR':'en-US') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between p-3 border-t bg-white text-xs">
            <div className="flex gap-2">
              <Button variant="secondary" type="button" disabled={loading || payPage===1} onClick={()=> setPayPage(p=> Math.max(1, p-1))}>{t('admin.billing.pagination.previous')}</Button>
              <Button variant="secondary" type="button" disabled={loading || !payHasMore} onClick={()=> setPayPage(p=> p+1)}>{t('admin.billing.pagination.next')}</Button>
            </div>
            <div className="flex items-center gap-4">
              <span>{t('admin.billing.pagination.page')} {payPage}{!loading && payments.length < PAGE_SIZE && !payHasMore ? ' '+t('admin.billing.pagination.final') : ''}</span>
              <span>{t('admin.billing.pagination.total')}: {payTotal == null ? '?' : payTotal}</span>
            </div>
          </div>
        </Card>
        {/* Mobile list payments */}
        <div className="space-y-3 md:hidden">
          {loading && <Card className="p-4"><Skeleton lines={3} /></Card>}
          {!loading && payments.length===0 && <Card className="p-4 text-center text-xs text-gray-500">{t('admin.billing.table.payments.empty')}</Card>}
          {!loading && payments.map(p => (
            <Card key={p.id} className="p-4 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <span className="font-mono text-[11px] select-all break-all max-w-[160px]">{p.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${p.status==='approved'?'bg-green-100 text-green-700': p.status==='pending'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{p.status}</span>
              </div>
              <div className="text-sm font-medium">{currencyFmt(p.amount_cents)}</div>
              <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
                <span>plan: {p.plan_id}</span>
                <span>{new Date(p.created_at).toLocaleString(locale==='pt'?'pt-BR':'en-US')}</span>
                {p.processed_at && <span>{t('admin.billing.table.payments.processed')}: {new Date(p.processed_at).toLocaleString(locale==='pt'?'pt-BR':'en-US')}</span>}
              </div>
            </Card>
          ))}
          {!loading && (
            <div className="flex justify-between items-center pt-2">
              <Button variant="secondary" type="button" disabled={loading || payPage===1} onClick={()=> setPayPage(p=> Math.max(1,p-1))}>{t('admin.billing.pagination.previous')}</Button>
              <span className="text-xs">{t('admin.billing.pagination.page')} {payPage}</span>
              <Button variant="secondary" type="button" disabled={loading || !payHasMore} onClick={()=> setPayPage(p=> p+1)}>{t('admin.billing.pagination.next')}</Button>
            </div>
          )}
        </div>
        </>
      )}

      {view==='planChanges' && (
        <>
        <Card className="p-0 overflow-x-auto hidden md:block">
          <div className="p-3 flex flex-wrap gap-3 items-end border-b bg-white">
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="secondary" disabled={loading} onClick={()=> { setChgPage(1); loadChanges(); }}>{t('admin.billing.filters.reload')}</Button>
              <Button type="button" variant="secondary" disabled={loading && !exportingChanges} onClick={exportChangesCSV}>{exportingChanges ? t('admin.billing.export.changes.inProgress') : t('admin.billing.export.changes')}</Button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">{t('admin.billing.table.changes.id')}</th>
                <th className="p-2">{t('admin.billing.table.changes.from')}</th>
                <th className="p-2">{t('admin.billing.table.changes.to')}</th>
                <th className="p-2">{t('admin.billing.table.changes.trigger')}</th>
                <th className="p-2">{t('admin.billing.table.changes.payment')}</th>
                <th className="p-2">{t('admin.billing.table.changes.created')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="p-4"><Skeleton lines={3} /></td></tr>}
              {!loading && changes.length===0 && <tr><td colSpan={6} className="p-4 text-sm text-gray-500">{t('admin.billing.table.changes.empty')}</td></tr>}
              {!loading && changes.map(c => (
                <tr key={c.id} className="border-b last:border-none hover:bg-gray-50">
                  <td className="p-2 font-mono text-xs select-all">{c.id}</td>
                  <td className="p-2 font-mono text-xs">{c.previous_plan_id || '—'}</td>
                  <td className="p-2 font-mono text-xs">{c.new_plan_id}</td>
                  <td className="p-2 text-xs">{c.trigger}</td>
                  <td className="p-2 text-xs">{c.payment_id || '—'}</td>
                  <td className="p-2 text-xs">{new Date(c.created_at).toLocaleString(locale==='pt'?'pt-BR':'en-US')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between p-3 border-t bg-white text-xs">
            <div className="flex gap-2">
              <Button variant="secondary" type="button" disabled={loading || chgPage===1} onClick={()=> setChgPage(p=> Math.max(1, p-1))}>{t('admin.billing.pagination.previous')}</Button>
              <Button variant="secondary" type="button" disabled={loading || !chgHasMore} onClick={()=> setChgPage(p=> p+1)}>{t('admin.billing.pagination.next')}</Button>
            </div>
            <div className="flex items-center gap-4">
              <span>{t('admin.billing.pagination.page')} {chgPage}{!loading && changes.length < PAGE_SIZE && !chgHasMore ? ' '+t('admin.billing.pagination.final') : ''}</span>
              <span>{t('admin.billing.pagination.total')}: {chgTotal == null ? '?' : chgTotal}</span>
            </div>
          </div>
        </Card>
        {/* Mobile list plan changes */}
        <div className="space-y-3 md:hidden">
          {loading && <Card className="p-4"><Skeleton lines={3} /></Card>}
          {!loading && changes.length===0 && <Card className="p-4 text-center text-xs text-gray-500">{t('admin.billing.table.changes.empty')}</Card>}
          {!loading && changes.map(c => (
            <Card key={c.id} className="p-4 space-y-1">
              <div className="flex justify-between items-start gap-2">
                <span className="font-mono text-[11px] select-all">#{c.id}</span>
                <span className="text-[10px] text-gray-500">{c.trigger}</span>
              </div>
              <div className="text-sm font-medium">{c.previous_plan_id || '—'} → {c.new_plan_id}</div>
              <div className="text-[11px] text-gray-600 flex flex-wrap gap-2">
                {c.payment_id && <span>pay: {c.payment_id}</span>}
                <span>{new Date(c.created_at).toLocaleString(locale==='pt'?'pt-BR':'en-US')}</span>
              </div>
            </Card>
          ))}
          {!loading && (
            <div className="flex justify-between items-center pt-2">
              <Button variant="secondary" type="button" disabled={loading || chgPage===1} onClick={()=> setChgPage(p=> Math.max(1,p-1))}>{t('admin.billing.pagination.previous')}</Button>
              <span className="text-xs">{t('admin.billing.pagination.page')} {chgPage}</span>
              <Button variant="secondary" type="button" disabled={loading || !chgHasMore} onClick={()=> setChgPage(p=> p+1)}>{t('admin.billing.pagination.next')}</Button>
            </div>
          )}
        </div>
        </>
      )}

      {view==='webhooks' && (
        <>
        <Card className="p-0 overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">ID</th>
                <th className="p-2">Evento</th>
                <th className="p-2">Status</th>
                <th className="p-2">Recebido</th>
                <th className="p-2">Latency</th>
                <th className="p-2">Tentativas</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="p-4"><Skeleton lines={3} /></td></tr>}
              {!loading && webhooks.length===0 && <tr><td colSpan={6} className="p-4 text-sm text-gray-500">{t('admin.billing.table.webhooks.empty')}</td></tr>}
              {!loading && webhooks.map(w => (
                <tr key={w.id} className="border-b last:border-none hover:bg-gray-50">
                  <td className="p-2 font-mono text-xs select-all">{w.id}</td>
                  <td className="p-2 font-mono text-xs">{w.event}</td>
                  <td className="p-2 text-xs"><span className={`px-2 py-0.5 rounded text-[10px] font-medium ${w.status==='processed'?'bg-green-100 text-green-700': 'bg-red-100 text-red-700'}`}>{w.status}</span></td>
                  <td className="p-2 text-xs">{new Date(w.received_at).toLocaleString(locale==='pt'?'pt-BR':'en-US')}</td>
                  <td className="p-2 text-xs">{w.latency_ms != null ? w.latency_ms+'ms' : '—'}</td>
                  <td className="p-2 text-xs">{w.attempts ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t text-[11px] text-gray-500">{t('admin.billing.webhooks.mockNote')}</div>
        </Card>
        <div className="space-y-3 md:hidden">
          {loading && <Card className="p-4"><Skeleton lines={3} /></Card>}
          {!loading && webhooks.length===0 && <Card className="p-4 text-center text-xs text-gray-500">{t('admin.billing.table.webhooks.empty')}</Card>}
          {!loading && webhooks.map(w => (
            <Card key={w.id} className="p-4 space-y-1">
              <div className="flex justify-between gap-2">
                <span className="font-mono text-[11px] select-all break-all max-w-[140px]">{w.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${w.status==='processed'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{w.status}</span>
              </div>
              <div className="text-[11px] text-gray-600 flex flex-wrap gap-2">
                <span>{w.event}</span>
                <span>{new Date(w.received_at).toLocaleString(locale==='pt'?'pt-BR':'en-US')}</span>
                {w.latency_ms!=null && <span>{w.latency_ms}ms</span>}
                {w.attempts!=null && <span>{w.attempts}x</span>}
              </div>
            </Card>
          ))}
        </div>
        </>
      )}
      <p className="text-[11px] text-gray-500">{t('admin.billing.nextSteps.note')}</p>
    </div>
  );
};

export default AdminBillingPage;
