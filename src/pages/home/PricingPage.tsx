import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { SEO } from '../../components/comum/SEO';
import { useAuth } from '../../contexts/useAuth';
import { TransparentCheckoutForm } from '../../components/billing/TransparentCheckoutForm';
import { useI18n } from '../../i18n';
import { useToast } from '../../components/ui/ToastProvider';
import { API } from '../../config/api';
import { usePermissions } from '../../hooks/usePermissions';
import UsageBar from '../../components/ui/UsageBar';

interface Plan { id: string; name: string; price_cents: number; capabilities?: string[]; limits?: Record<string, number | null>; }

// Configurações locais (poderiam migrar para config central depois)
const SHOW_INLINE_STATUS_FOR_PAYMENT = false; // exibe/oculta mensagem inline para approved/pending

export default function PricingPage() {
  const { getAccessToken } = useAuth();
  const { t, locale } = useI18n();
  const { push } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<null | { payment_id: string; plan: Plan; public_key: string; amount_cents: number }>(null);
  const [downgrading, setDowngrading] = useState(false);
  const [showConfirmDowngrade, setShowConfirmDowngrade] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const { capabilities, limits, usage } = usePermissions();
  const [freeCapabilities, setFreeCapabilities] = useState<string[]>([]);
  const [freeLimits, setFreeLimits] = useState<Record<string, number | null>>({ CONSULTAS_MES: 0 });
  const [overLimitBlocking, setOverLimitBlocking] = useState<null | { keys: string[] }>(null);
  const [confirmOverLimit, setConfirmOverLimit] = useState(false);

  // Baselines dinamicamente ajustados após carregar planos; fallback inicial acima
  const FREE_CAPABILITIES = freeCapabilities; // manter nomes usados abaixo
  const FREE_LIMITS = freeLimits;
  const reducedLimits = useMemo(() => {
    const out: { key: string; current: number | null; free: number | null; diff: number | null }[] = [];
    Object.entries(limits || {}).forEach(([k,v]) => {
      const freeVal = FREE_LIMITS[k];
      if (freeVal === undefined) return;
      if (v === freeVal) return;
      const cNum = v == null ? null : v;
      const fNum = freeVal == null ? null : freeVal;
      let diff: number | null = null;
      if (typeof cNum === 'number' && typeof fNum === 'number') diff = cNum - fNum;
      out.push({ key: k, current: cNum, free: fNum, diff });
    });
    // Ordena por maior redução
    out.sort((a,b) => (b.diff ?? 0) - (a.diff ?? 0));
    return out;
  }, [limits, FREE_LIMITS]);
  const lostCapabilities = useMemo(() => {
    if (!capabilities || capabilities.length === 0) return [] as string[];
    return capabilities.filter(c => !FREE_CAPABILITIES.includes(c));
  }, [capabilities, FREE_CAPABILITIES]);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
  const res = await fetch(API.PLANS);
      if (res.status === 304) return; // cached
      const data = await res.json();
      setPlans(data.plans || []);
      // Detecta plano free e extrai baseline se disponível
      const free = (data.plans || []).find((p: any) => p.id === 'free');
      if (free) {
        if (Array.isArray(free.capabilities)) setFreeCapabilities(free.capabilities);
        if (free.limits && typeof free.limits === 'object') setFreeLimits(free.limits);
      }
      if (data.current_plan_id) {
        setCurrentPlanId(data.current_plan_id);
        try { sessionStorage.setItem('currentPlanId', data.current_plan_id); } catch {}
      }
    } catch (e:any) {
      setError(t('billing.plans.error.load'));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => {
    // seed from sessionStorage to reduzir flicker
    try {
      const cached = sessionStorage.getItem('currentPlanId');
      if (cached) setCurrentPlanId(prev => prev || cached);
    } catch {}
    loadPlans();
  }, [loadPlans]);

  async function startCheckout(planId: string) {
    const token = await getAccessToken();
    if (!token) { setError(t('auth.error.loginRequired')); return; }
    setCreating(planId);
    setError(null); setMessage(null);
    try {
      const res = await fetch(API.BILLING_INTENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ plan_id: planId })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t('billing.intent.error')); return; }
      if (data?.payment_id && data?.plan && data?.public_key) {
        setCheckout({ payment_id: data.payment_id, plan: data.plan, public_key: data.public_key, amount_cents: data.plan.price_cents });
        setMessage(t('billing.intent.created.fillCard'));
      } else {
        setMessage(t('billing.intent.created.incomplete'));
      }
    } catch (e:any) {
      setError(t('billing.intent.error'));
    } finally {
      setCreating(null);
    }
  }

  function handlePaid(status: string) {
    if (status === 'approved') {
      if (SHOW_INLINE_STATUS_FOR_PAYMENT) setMessage(t('billing.checkout.status.approved')); else setMessage(null);
      push({ type: 'success', message: t('billing.upgrade.success') });
      try { sessionStorage.setItem('lastPaymentApprovedToast', String(Date.now())); } catch {}
      window.dispatchEvent(new CustomEvent('entitlements:refresh'));
    } else if (status === 'pending') {
      if (SHOW_INLINE_STATUS_FOR_PAYMENT) setMessage(t('billing.checkout.status.pending')); else setMessage(null);
      push({ type: 'info', message: t('billing.upgrade.waiting') });
    } else {
      setMessage(t('billing.checkout.status.generic', { status }));
    }
  }

  function openDowngradeDialog(){
    previouslyFocused.current = document.activeElement as HTMLElement;
    // Detecta limites que ficarão acima do permitido no plano Free
    const exceeded: string[] = [];
    Object.entries(freeLimits || {}).forEach(([k, future]) => {
      if (future == null) return; // ilimitado
      const currentUse = usage?.[k];
      if (typeof currentUse === 'number' && currentUse > future) exceeded.push(k);
    });
    if (exceeded.length > 0) {
      setOverLimitBlocking({ keys: exceeded });
      setConfirmOverLimit(false);
    } else {
      setOverLimitBlocking(null);
      setConfirmOverLimit(false);
    }
    setShowConfirmDowngrade(true);
  }

  function closeModal(){
    setShowConfirmDowngrade(false);
    setTimeout(()=>{
      if (previouslyFocused.current) {
        try { previouslyFocused.current.focus(); } catch {}
      }
    }, 0);
  }

  async function handleDowngrade(){
    if (downgrading) return;
    if (overLimitBlocking && !confirmOverLimit) {
      // primeira tentativa serve de pré-confirmação
      setConfirmOverLimit(true);
      return;
    }
    setDowngrading(true);
    try {
      const token = await getAccessToken();
      if(!token){ push({ type:'error', message: t('auth.error.loginRequired') }); return; }
      const res = await fetch(API.BILLING_DOWNGRADE, { method:'POST', headers: { 'Content-Type':'application/json', Authorization: 'Bearer '+token }, body: JSON.stringify({}) });
      const data = await res.json();
      if(!res.ok){ push({ type:'error', message: data.error || t('billing.downgrade.error') }); return; }
      push({ type:'success', message: t('billing.downgrade.success') });
      setCurrentPlanId('free');
      try { sessionStorage.setItem('currentPlanId', 'free'); } catch {}
      window.dispatchEvent(new CustomEvent('entitlements:refresh'));
      closeModal();
    } catch(e:any){
      push({ type:'error', message: e.message || t('billing.downgrade.error') });
    } finally { setDowngrading(false); }
  }

  // Focus trap & ESC close
  useEffect(() => {
    if (!showConfirmDowngrade) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); if(!downgrading) closeModal(); }
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };
    document.addEventListener('keydown', handler);
    // focus first actionable
    setTimeout(()=>{
      const btn = modalRef.current?.querySelector('button');
      try { btn?.focus(); } catch {}
    }, 0);
    return () => document.removeEventListener('keydown', handler);
  }, [showConfirmDowngrade, downgrading]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <SEO title={t('pricing.seo.title')} description={t('pricing.seo.desc')} />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">{t('billing.plans.title')}</h1>
        <div className="flex flex-col items-start md:items-end text-sm">
          {(() => {
            const planObj = plans.find(p => p.id === currentPlanId);
            const labelName = planObj?.name || currentPlanId;
            return (
              <span className="font-medium">
                {currentPlanId ? t('billing.currentPlan.label', { plan: labelName || '-' }) : t('billing.currentPlan.loading')}
              </span>
            );
          })()}
          <div className="flex gap-3 mt-1 flex-wrap">
            <button
              type="button"
              onClick={() => window.location.assign('/billing/historico')}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
            >
              <span>{t('billing.manage.link')}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
            {currentPlanId && currentPlanId !== 'free' && (
              <button
                type="button"
                disabled={downgrading}
                onClick={openDowngradeDialog}
                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 disabled:opacity-50"
              >
                {downgrading ? t('billing.downgrade.processing') : t('billing.downgrade.button')}
              </button>
            )}
          </div>
        </div>
      </div>
      {loading && <p>{t('billing.plans.loading')}</p>}
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {message && (
        <p className="text-green-600 text-sm mb-4" aria-live="polite">
          {message}
        </p>
      )}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map(p => {
          const price = new Intl.NumberFormat(locale==='pt'?'pt-BR':'en-US', { style: 'currency', currency: 'BRL'}).format(p.price_cents/100);
          return (
            <div key={p.id} className={`border rounded-lg p-4 shadow-sm flex flex-col relative ${p.id===currentPlanId ? 'border-green-500' : ''}`}>
              {p.id===currentPlanId && (
                <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">{t('billing.plan.current.badge')}</span>
              )}
              <h2 className="text-xl font-semibold mb-2">{p.name}</h2>
              <p className="text-2xl font-bold mb-4">{price}</p>
              <button
                disabled={creating === p.id || p.id===currentPlanId}
                onClick={() => startCheckout(p.id)}
                className="mt-auto bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
              >{p.id===currentPlanId ? t('billing.plan.current.badge') : (creating === p.id ? t('billing.intent.creating') : t('billing.plans.subscribe'))}</button>
            </div>
          );
        })}
      </div>

      {showConfirmDowngrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="downgrade-title" aria-describedby="downgrade-desc">
          <div className="absolute inset-0 bg-black/40" onClick={() => !downgrading && closeModal()} />
            <div ref={modalRef} className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6" tabIndex={-1}>
              <h3 id="downgrade-title" className="text-lg font-semibold mb-2">{t('billing.downgrade.title')}</h3>
              <p id="downgrade-desc" className="text-sm text-slate-600 mb-4">{t('billing.downgrade.desc')}</p>
              {overLimitBlocking && (
                <div className="mb-4 border border-orange-300 bg-orange-50 rounded p-3 text-[12px] text-orange-800">
                  {!confirmOverLimit ? (
                    <>
                      <p className="font-semibold mb-1">{t('billing.downgrade.overLimit.title')}</p>
                      <p className="mb-2 leading-snug">{t('billing.downgrade.overLimit.desc')}</p>
                      <ul className="list-disc pl-5 space-y-1 mb-2">
                        {overLimitBlocking.keys.map(k => {
                          const labelKey = ('limitLabel.'+k) as any;
                          let friendly = t(labelKey);
                          if (friendly === labelKey) friendly = k;
                          const currentUse = usage?.[k];
                          const future = freeLimits[k];
                          return (
                            <li key={k} className="flex flex-wrap items-center gap-1">
                              <span className="font-medium">{friendly}</span>
                              <span className="font-mono text-xs bg-white/60 px-1 rounded">{currentUse ?? 0} → {future}</span>
                            </li>
                          );
                        })}
                      </ul>
                      <p className="text-[11px] italic">{t('billing.downgrade.overLimit.actionHint')}</p>
                    </>
                  ) : (
                    <p className="text-[11px] font-medium">{t('billing.downgrade.overLimit.confirmSecond')}</p>
                  )}
                </div>
              )}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-1">{t('billing.downgrade.features.title')}</h4>
                <p className="text-[11px] text-slate-500 mb-2">{t('billing.downgrade.features.note')}</p>
                <div className="border rounded p-3 bg-slate-50 max-h-40 overflow-auto">
                  {lostCapabilities.length > 0 ? (
                    <ul className="text-xs text-slate-700 list-disc pl-4 space-y-1">
                      {lostCapabilities.map(cap => {
                        const labelKey = ('capability.'+cap) as any;
                        const friendly = t(labelKey);
                        return (
                          <li key={cap} className="break-all">
                            <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px] mr-1">{friendly !== labelKey ? friendly : cap}</code>
                            {t('billing.downgrade.features.losing')}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">{t('billing.downgrade.features.none')}</p>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-1">{t('billing.downgrade.limits.title')}</h4>
                <p className="text-[11px] text-slate-500 mb-2">{t('billing.downgrade.limits.note')}</p>
                <div className="border rounded p-3 bg-amber-50 max-h-52 overflow-auto">
                  {reducedLimits.length > 0 ? (
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="text-amber-800">
                          <th className="text-left font-semibold pb-1">{t('billing.downgrade.limits.col.resource')}</th>
                          <th className="text-left font-semibold pb-1">{t('billing.downgrade.limits.col.delta')}</th>
                          <th className="text-left font-semibold pb-1">{t('billing.downgrade.limits.col.usage')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reducedLimits.map(r => {
                          const critical = (r.free ?? 0) === 0 && (r.current ?? 0) > 0;
                          const labelKey = ('limitLabel.'+r.key) as any;
                          let friendly = t(labelKey);
                          if (friendly === labelKey) friendly = r.key; // fallback
                          const currentUse = (usage && typeof usage[r.key] === 'number') ? usage[r.key] : 0;
                          return (
                            <tr key={r.key} className={critical ? 'bg-red-100/60' : 'odd:bg-amber-100/40'}>
                              <td className="pr-3 align-top whitespace-nowrap">
                                <code
                                  className={critical? 'bg-red-200 px-1 rounded' : 'bg-amber-200 px-1 rounded'}
                                  title={t('billing.downgrade.limits.resource.tooltip') + ' ('+ r.key + ')'}
                                >{friendly}</code>
                              </td>
                              <td className="pr-2">
                                <span className="font-mono">
                                  {(r.current ?? '∞')} <span className="text-amber-700">→</span> {(r.free ?? '∞')}
                                </span>
                                {typeof r.diff === 'number' && (
                                  <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-amber-200 text-amber-800" title={t('billing.downgrade.limits.diff.tooltip')}>
                                    -{r.diff}
                                  </span>
                                )}
                              </td>
                              <td className="align-top min-w-[90px]">
                                <UsageBar value={currentUse} limit={r.current} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-amber-700">{t('billing.downgrade.limits.none')}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={downgrading}
                  onClick={() => closeModal()}
                  className="px-4 py-2 rounded border text-sm hover:bg-slate-50 disabled:opacity-50"
                >{t('billing.downgrade.cancel')}</button>
                <button
                  type="button"
                  disabled={downgrading}
                  onClick={handleDowngrade}
                  className={`px-4 py-2 rounded text-white text-sm disabled:opacity-50 ${overLimitBlocking ? (confirmOverLimit ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700') : 'bg-rose-600 hover:bg-rose-700'}`}
                  title={overLimitBlocking && !confirmOverLimit ? t('billing.downgrade.overLimit.proceed') : undefined}
                >{downgrading ? t('billing.downgrade.processing') : overLimitBlocking ? (confirmOverLimit ? t('billing.downgrade.confirm.button') : t('billing.downgrade.overLimit.proceed')) : t('billing.downgrade.confirm.button')}</button>
              </div>
            </div>
        </div>
      )}

      {checkout && (
        <div className="mt-10 border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t('billing.checkout.plan.title', { plan: checkout.plan.name })}</h2>
          <TransparentCheckoutForm
            publicKey={checkout.public_key}
            paymentId={checkout.payment_id}
            amountCents={checkout.amount_cents}
            getAccessToken={getAccessToken}
            onPaid={handlePaid}
          />
        </div>
      )}
    </div>
  );
}
