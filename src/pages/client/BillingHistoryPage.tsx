import { useEffect, useState, useCallback } from 'react';
import { API } from '../../config/api';
import { useAuth } from '../../contexts/useAuth';
import { useI18n } from '../../i18n';
import { SEO } from '../../components/comum/SEO';
import { useToast } from '../../components/ui/ToastProvider';

interface Payment { id: string; plan_id: string; amount_cents: number; currency: string; status: string; status_detail?: string | null; external_id?: string | null; processed_at?: string | null; created_at: string; }
interface PlanChange { id: number; old_plan_id: string | null; new_plan_id: string; reason: string; payment_id?: string | null; created_at: string; }

export default function BillingHistoryPage(){
  const { getAccessToken } = useAuth();
  const { locale, t } = useI18n();
  // Toast not currently used (downgrade removed); keep hook for future enhancements
  useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [changes, setChanges] = useState<PlanChange[]>([]);
  // Downgrade flow removed
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async ()=> {
    setLoading(true); setError(null);
    try {
  const token = await getAccessToken(); if (!token) { setError(t('auth.error.loginRequired')); return; }
      const [pRes, cRes] = await Promise.all([
        fetch(API.BILLING_PAYMENTS, { headers: { Authorization: 'Bearer '+token }}),
        fetch(API.BILLING_PLAN_CHANGES, { headers: { Authorization: 'Bearer '+token }})
      ]);
      const pJson = await pRes.json(); const cJson = await cRes.json();
  if(!pRes.ok) throw new Error(pJson.error || t('billing.history.error.payments'));
  if(!cRes.ok) throw new Error(cJson.error || t('billing.history.error.planChanges'));
      setPayments(pJson.payments || []);
      setChanges(cJson.changes || []);
    } catch (e:any) {
      setError(e.message || t('billing.history.error.generic'));
    } finally { setLoading(false); }
  }, [getAccessToken, t]);

  useEffect(()=> { load(); }, [load]);

  // downgrade() removed

  function fmtCurrency(cents:number){
    return new Intl.NumberFormat(locale==='pt'?'pt-BR':'en-US', { style:'currency', currency:'BRL'}).format(cents/100);
  }

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <SEO title={t('billing.history.seo.title')} description={t('billing.history.seo.desc')} />
      <h1 className='text-2xl font-bold mb-4'>{t('billing.history.title')}</h1>
      <div className='flex gap-4 mb-6'>
        <button onClick={load} className='px-3 py-1.5 rounded bg-slate-200 text-sm'>{t('billing.history.reload')}</button>
  {/* Downgrade button removed */}
      </div>
      {loading && <p>{t('billing.history.loading')}</p>}
      {error && <p className='text-red-600 text-sm mb-4'>{error}</p>}
      <div className='grid md:grid-cols-2 gap-8'>
        <div>
          <h2 className='font-semibold mb-2'>{t('billing.history.payments')}</h2>
          <div className='space-y-2 max-h-96 overflow-auto pr-2'>
            {payments.map(p=> (
              <div key={p.id} className='border rounded p-3 text-sm flex flex-col gap-1'>
                <div className='flex justify-between'>
                  <span className='font-mono'>{p.id.slice(0,8)}</span>
                  <span className='px-2 py-0.5 rounded text-xs bg-slate-100'>{p.status}</span>
                </div>
                <div className='flex justify-between text-slate-600'>
                  <span>{p.plan_id}</span>
                  <span>{fmtCurrency(p.amount_cents)}</span>
                </div>
                <div className='text-[11px] text-slate-500 flex justify-between'>
                  <span>{new Date(p.created_at).toLocaleString()}</span>
                  {p.processed_at && <span>{t('billing.history.processedAt')}: {new Date(p.processed_at).toLocaleString()}</span>}
                </div>
              </div>
            ))}
            {payments.length===0 && !loading && <p className='text-xs text-slate-500'>{t('billing.history.empty.payments')}</p>}
          </div>
        </div>
        <div>
          <h2 className='font-semibold mb-2'>{t('billing.history.planChanges')}</h2>
          <div className='space-y-2 max-h-96 overflow-auto pr-2'>
            {changes.map(c=> (
              <div key={c.id} className='border rounded p-3 text-sm flex flex-col gap-1'>
                <div className='flex justify-between'>
                  <span className='font-mono'>#{c.id}</span>
                  <span className='px-2 py-0.5 rounded text-xs bg-slate-100'>{c.reason}</span>
                </div>
                <div className='text-slate-600'>{c.old_plan_id || '—'} → {c.new_plan_id}</div>
                <div className='text-[11px] text-slate-500'>{new Date(c.created_at).toLocaleString()}</div>
              </div>
            ))}
            {changes.length===0 && !loading && <p className='text-xs text-slate-500'>{t('billing.history.empty.planChanges')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
