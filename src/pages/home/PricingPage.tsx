import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { SEO } from '../../components/comum/SEO';
import { useAuth } from '../../contexts/useAuth';
import { TransparentCheckoutForm } from '../../components/billing/TransparentCheckoutForm';
import { useI18n } from '../../i18n';
import { useToast } from '../../components/ui/ToastProvider';
import { API } from '../../config/api';
import { usePermissions } from '../../hooks/usePermissions';
import UsageBar from '../../components/ui/UsageBar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface Plan { 
  id: string; 
  name: string; 
  price_cents: number; 
  capabilities?: string[]; 
  limits?: Record<string, number | null>; 
}

// Configurações locais
const SHOW_INLINE_STATUS_FOR_PAYMENT = false;

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

  // Baselines dinamicamente ajustados
  const FREE_CAPABILITIES = freeCapabilities;
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
      if (res.status === 304) return;
      const data = await res.json();
      setPlans(data.plans || []);
      
      const free = (data.plans || []).find((p: any) => p.id === 'free');
      if (free) {
        if (Array.isArray(free.capabilities)) setFreeCapabilities(free.capabilities);
        if (free.limits && typeof free.limits === 'object') setFreeLimits(free.limits);
      }
      if (data.current_plan_id) {
        setCurrentPlanId(data.current_plan_id);
        try { sessionStorage.setItem('currentPlanId', data.current_plan_id); } catch {}
      }
    } catch (e: any) {
      setError(t('billing.plans.error.load'));
    } finally { 
      setLoading(false); 
    }
  }, [t]);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('currentPlanId');
      if (cached) setCurrentPlanId(prev => prev || cached);
    } catch {}
    loadPlans();
  }, [loadPlans]);

  async function startCheckout(planId: string) {
    const token = await getAccessToken();
    if (!token) { 
      setError(t('auth.error.loginRequired')); 
      return; 
    }
    setCreating(planId);
    setError(null); 
    setMessage(null);
    try {
      const res = await fetch(API.BILLING_INTENT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: 'Bearer ' + token 
        },
        body: JSON.stringify({ plan_id: planId })
      });
      const data = await res.json();
      if (!res.ok) { 
        setError(data.error || t('billing.intent.error')); 
        return; 
      }
      if (data?.payment_id && data?.plan && data?.public_key) {
        setCheckout({ 
          payment_id: data.payment_id, 
          plan: data.plan, 
          public_key: data.public_key, 
          amount_cents: data.plan.price_cents 
        });
        setMessage(t('billing.intent.created.fillCard'));
      } else {
        setMessage(t('billing.intent.created.incomplete'));
      }
    } catch (e: any) {
      setError(t('billing.intent.error'));
    } finally {
      setCreating(null);
    }
  }

  function handlePaid(status: string) {
    if (status === 'approved') {
      if (SHOW_INLINE_STATUS_FOR_PAYMENT) setMessage(t('billing.checkout.status.approved')); 
      else setMessage(null);
      push({ type: 'success', message: t('billing.upgrade.success') });
      try { 
        sessionStorage.setItem('lastPaymentApprovedToast', String(Date.now())); 
      } catch {}
      window.dispatchEvent(new CustomEvent('entitlements:refresh'));
    } else if (status === 'pending') {
      if (SHOW_INLINE_STATUS_FOR_PAYMENT) setMessage(t('billing.checkout.status.pending')); 
      else setMessage(null);
      push({ type: 'info', message: t('billing.upgrade.waiting') });
    } else {
      setMessage(t('billing.checkout.status.generic', { status }));
    }
  }

  function openDowngradeDialog() {
    previouslyFocused.current = document.activeElement as HTMLElement;
    const exceeded: string[] = [];
    Object.entries(freeLimits || {}).forEach(([k, future]) => {
      if (future == null) return;
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

  function closeModal() {
    setShowConfirmDowngrade(false);
    setTimeout(() => {
      if (previouslyFocused.current) {
        try { previouslyFocused.current.focus(); } catch {}
      }
    }, 0);
  }

  async function handleDowngrade() {
    if (downgrading) return;
    if (overLimitBlocking && !confirmOverLimit) {
      setConfirmOverLimit(true);
      return;
    }
    setDowngrading(true);
    try {
      const token = await getAccessToken();
      if (!token) { 
        push({ type: 'error', message: t('auth.error.loginRequired') }); 
        return; 
      }
      const res = await fetch(API.BILLING_DOWNGRADE, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: 'Bearer ' + token 
        }, 
        body: JSON.stringify({}) 
      });
      const data = await res.json();
      if (!res.ok) { 
        push({ type: 'error', message: data.error || t('billing.downgrade.error') }); 
        return; 
      }
      push({ type: 'success', message: t('billing.downgrade.success') });
      setCurrentPlanId('free');
      try { sessionStorage.setItem('currentPlanId', 'free'); } catch {}
      window.dispatchEvent(new CustomEvent('entitlements:refresh'));
      closeModal();
    } catch (e: any) {
      push({ type: 'error', message: e.message || t('billing.downgrade.error') });
    } finally { 
      setDowngrading(false); 
    }
  }

  // Focus trap & ESC close
  useEffect(() => {
    if (!showConfirmDowngrade) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { 
        e.preventDefault(); 
        if (!downgrading) closeModal(); 
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { 
            e.preventDefault(); 
            last.focus(); 
          }
        } else {
          if (document.activeElement === last) { 
            e.preventDefault(); 
            first.focus(); 
          }
        }
      }
    };
    document.addEventListener('keydown', handler);
    setTimeout(() => {
      const btn = modalRef.current?.querySelector('button');
      try { btn?.focus(); } catch {}
    }, 0);
    return () => document.removeEventListener('keydown', handler);
  }, [showConfirmDowngrade, downgrading]);

  // Função auxiliar para formatar preço
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(cents / 100);
  };

  // Função auxiliar para obter ícone do plano
  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return '🆓';
      case 'premium':
        return '⭐';
      case 'pro':
        return '🚀';
      default:
        return '📋';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 pb-20 space-y-8">
      <SEO title={t('pricing.seo.title')} description={t('pricing.seo.desc')} />
      
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {t('billing.plans.title')}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Escolha o plano perfeito para sua jornada nutricional
        </p>
      </div>

      {/* Current Plan Info */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Plano Atual</h2>
              <p className="text-gray-600 text-xs">
                {(() => {
                  const planObj = plans.find(p => p.id === currentPlanId);
                  const labelName = planObj?.name || currentPlanId;
                  return currentPlanId ? 
                    t('billing.currentPlan.label', { plan: labelName || '-' }) : 
                    t('billing.currentPlan.loading');
                })()}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              onClick={() => window.location.assign('/billing/historico')}
              className="flex items-center gap-2 border border-gray-300 hover:border-gray-400 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {t('billing.manage.link')}
            </Button>
            
            {currentPlanId && currentPlanId !== 'free' && (
              <Button
                variant="secondary"
                disabled={downgrading}
                onClick={openDowngradeDialog}
                className="flex items-center gap-2 border border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50 disabled:opacity-50"
              >
                {downgrading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('billing.downgrade.processing')}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {t('billing.downgrade.button')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <svg className="w-8 h-8 text-blue-500 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">{t('billing.plans.loading')}</p>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </Card>
      )}

      {/* Success Message */}
      {message && (
        <Card className="p-4 bg-green-50 border border-green-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 text-sm" aria-live="polite">{message}</span>
          </div>
        </Card>
      )}

      {/* Pricing Plans */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => {
            const isCurrent = plan.id === currentPlanId;
            const isCreating = creating === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`p-6 relative transition-all duration-300 hover:shadow-lg ${
                  isCurrent 
                    ? 'border-2 border-green-500 bg-green-50/50' 
                    : 'border border-gray-200 bg-white'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                      {t('billing.plan.current.badge')}
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className="text-3xl mb-2">{getPlanIcon(plan.id)}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {formatPrice(plan.price_cents)}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Aqui você pode adicionar features específicas de cada plano */}
                  <div className="text-sm text-gray-600 text-center">
                    Inclui todas as funcionalidades
                  </div>
                </div>

                <Button
                  disabled={isCreating || isCurrent}
                  onClick={() => startCheckout(plan.id)}
                  className={`w-full ${
                    isCurrent
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  } text-white border-0`}
                >
                  {isCurrent ? (
                    t('billing.plan.current.badge')
                  ) : isCreating ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('billing.intent.creating')}
                    </div>
                  ) : (
                    t('billing.plans.subscribe')
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Checkout Form */}
      {checkout && (
        <Card className="p-6 bg-white border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('billing.checkout.plan.title', { plan: checkout.plan.name })}
              </h2>
              <p className="text-gray-600">Complete seu pagamento</p>
            </div>
          </div>
          
          <TransparentCheckoutForm
            publicKey={checkout.public_key}
            paymentId={checkout.payment_id}
            amountCents={checkout.amount_cents}
            getAccessToken={getAccessToken}
            onPaid={handlePaid}
          />
        </Card>
      )}

      {/* Downgrade Modal */}
      {showConfirmDowngrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="downgrade-title">
          <div className="absolute inset-0 bg-black/40" onClick={() => !downgrading && closeModal()} />
          <div 
            ref={modalRef} 
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            tabIndex={-1}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-xl">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 id="downgrade-title" className="text-xl font-bold text-gray-900">
                  {t('billing.downgrade.title')}
                </h3>
              </div>
              <p className="text-gray-600">{t('billing.downgrade.desc')}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Over Limit Warning */}
              {overLimitBlocking && (
                <Card className="border border-orange-300 bg-orange-50">
                  <div className="p-4">
                    {!confirmOverLimit ? (
                      <>
                        <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {t('billing.downgrade.overLimit.title')}
                        </h4>
                        <p className="text-orange-700 text-sm mb-3">{t('billing.downgrade.overLimit.desc')}</p>
                        <ul className="space-y-2 mb-3">
                          {overLimitBlocking.keys.map(k => {
                            const labelKey = ('limitLabel.'+k) as any;
                            let friendly = t(labelKey);
                            if (friendly === labelKey) friendly = k;
                            const currentUse = usage?.[k];
                            const future = freeLimits[k];
                            return (
                              <li key={k} className="flex items-center justify-between text-sm">
                                <span className="font-medium text-orange-800">{friendly}</span>
                                <span className="font-mono bg-white/60 px-2 py-1 rounded text-orange-800">
                                  {currentUse ?? 0} → {future}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                        <p className="text-xs text-orange-600 italic">{t('billing.downgrade.overLimit.actionHint')}</p>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-orange-800">{t('billing.downgrade.overLimit.confirmSecond')}</p>
                    )}
                  </div>
                </Card>
              )}

              {/* Features Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('billing.downgrade.features.title')}</h4>
                <Card className="border border-gray-200">
                  <div className="p-4 max-h-40 overflow-y-auto">
                    {lostCapabilities.length > 0 ? (
                      <ul className="space-y-2">
                        {lostCapabilities.map(cap => {
                          const labelKey = ('capability.'+cap) as any;
                          const friendly = t(labelKey);
                          return (
                            <li key={cap} className="flex items-center gap-3 text-sm text-gray-700">
                              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs mr-2">
                                  {friendly !== labelKey ? friendly : cap}
                                </code>
                                {t('billing.downgrade.features.losing')}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">{t('billing.downgrade.features.none')}</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Limits Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('billing.downgrade.limits.title')}</h4>
                <Card className="border border-amber-200 bg-amber-50">
                  <div className="p-4 max-h-52 overflow-y-auto">
                    {reducedLimits.length > 0 ? (
                      <div className="space-y-3">
                        {reducedLimits.map(r => {
                          const critical = (r.free ?? 0) === 0 && (r.current ?? 0) > 0;
                          const labelKey = ('limitLabel.'+r.key) as any;
                          let friendly = t(labelKey);
                          if (friendly === labelKey) friendly = r.key;
                          const currentUse = (usage && typeof usage[r.key] === 'number') ? usage[r.key] : 0;
                          
                          return (
                            <div key={r.key} className={`p-3 rounded-lg ${critical ? 'bg-red-100/60 border border-red-200' : 'bg-white/60 border border-amber-100'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-medium ${critical ? 'text-red-800' : 'text-amber-800'}`}>
                                  {friendly}
                                </span>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="font-mono">
                                    {r.current ?? '∞'} 
                                    <span className="mx-1 text-amber-600">→</span> 
                                    {r.free ?? '∞'}
                                  </span>
                                  {typeof r.diff === 'number' && (
                                    <span className="px-2 py-1 rounded bg-amber-200 text-amber-800 text-xs">
                                      -{r.diff}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <UsageBar value={currentUse} limit={r.current} />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-amber-700 text-center py-4">{t('billing.downgrade.limits.none')}</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <Button
                variant="secondary"
                disabled={downgrading}
                onClick={closeModal}
                className="border border-gray-300 hover:border-gray-400"
              >
                {t('billing.downgrade.cancel')}
              </Button>
              <Button
                disabled={downgrading}
                onClick={handleDowngrade}
                className={`${
                  overLimitBlocking 
                    ? (confirmOverLimit 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-orange-600 hover:bg-orange-700')
                    : 'bg-rose-600 hover:bg-rose-700'
                } text-white border-0`}
              >
                {downgrading ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('billing.downgrade.processing')}
                  </div>
                ) : overLimitBlocking ? (
                  confirmOverLimit ? t('billing.downgrade.confirm.button') : t('billing.downgrade.overLimit.proceed')
                ) : (
                  t('billing.downgrade.confirm.button')
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}