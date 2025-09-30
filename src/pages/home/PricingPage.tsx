import { useEffect, useState, useCallback } from 'react';
import { SEO } from '../../components/comum/SEO';
import { useAuth } from '../../contexts/useAuth';
import { TransparentCheckoutForm } from '../../components/billing/TransparentCheckoutForm';
import { useI18n } from '../../i18n';
import { useToast } from '../../components/ui/ToastProvider';
import { API } from '../../config/api';
import { usePermissions } from '../../hooks/usePermissions';
import { usePlanIntent } from '../../hooks/usePlanIntent';
// import UsageBar from '../../components/ui/UsageBar'; // downgrade UI removed, keep comment if reintroduced later

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
  // Downgrade removido: manter estado legado desativado para evitar erros caso referências permaneçam
  // Downgrade removed: clean states
  const { /* capabilities, limits */ } = usePermissions();
  const { intent, clearIntent } = usePlanIntent();
  const [dismissedIntent, setDismissedIntent] = useState(false);

  useEffect(() => {
    if (intent === 'consultation') {
      try {
        const dismissedTs = sessionStorage.getItem('planIntent:consultation:dismissed');
        if (dismissedTs) setDismissedIntent(true);
      } catch {/* ignore */}
    }
  }, [intent]);

  function dismissIntentBanner() {
    if (intent === 'consultation') {
      try { sessionStorage.setItem('planIntent:consultation:dismissed', String(Date.now())); } catch {}
    }
    setDismissedIntent(true);
    clearIntent();
  }
  // Removed freeCapabilities/freeLimits (only used for downgrade comparisons previously)
  // Estados relacionados a downgrade (legacy, agora sempre null)
  // Removed legacy states (overLimitBlocking, confirmOverLimit)

  // Baselines dinamicamente ajustados após carregar planos; fallback inicial acima
  // Legacy constants removed (FREE_CAPABILITIES, FREE_LIMITS)
  // Removed downgrade calculations (reducedLimits, lostCapabilities)

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
  const res = await fetch(API.PLANS);
      if (res.status === 304) return; // cached
      const data = await res.json();
      setPlans(data.plans || []);
      // Detecta plano free e extrai baseline se disponível
      // (Downgrade removed) previously we derived free plan baseline here
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

  // Removido: diálogo de downgrade e lógica associada

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
            {/* Downgrade action removed */}
          </div>
        </div>
      </div>
      {intent === 'consultation' && !dismissedIntent && (
        <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm flex items-start gap-3 animate-fade-in">
          <div className="flex-1">
            <p className="font-medium text-blue-800">{t('pricing.intent.consultation.banner.title')}</p>
            <p className="text-blue-700 mt-1">{t('pricing.intent.consultation.banner.desc')}</p>
          </div>
          <button
            onClick={dismissIntentBanner}
            aria-label={t('pricing.intent.consultation.banner.dismiss')}
            className="text-blue-700 hover:text-blue-900 text-xs font-medium"
          >{t('pricing.intent.consultation.banner.dismiss')}</button>
        </div>
      )}
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

  {/* Downgrade modal removed */}

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
