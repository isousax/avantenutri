import { useEffect, useState, useCallback } from 'react';
import { API } from '../../config/api';
import { useAuth } from '../../contexts/useAuth';
import { useI18n } from '../../i18n';
import { SEO } from '../../components/comum/SEO';
import { useToast } from '../../components/ui/ToastProvider';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface Payment { 
  id: string; 
  plan_id: string; 
  amount_cents: number; 
  currency: string; 
  status: string; 
  status_detail?: string | null; 
  external_id?: string | null; 
  processed_at?: string | null; 
  created_at: string; 
}

interface PlanChange { 
  id: number; 
  old_plan_id: string | null; 
  new_plan_id: string; 
  reason: string; 
  payment_id?: string | null; 
  created_at: string; 
}

export default function BillingHistoryPage() {
  const { getAccessToken } = useAuth();
  const { locale, t } = useI18n();
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [changes, setChanges] = useState<PlanChange[]>([]);
  const [downgrading, setDowngrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); 
    setError(null);
    try {
      const token = await getAccessToken(); 
      if (!token) { 
        setError(t('auth.error.loginRequired')); 
        return; 
      }
      
      const [pRes, cRes] = await Promise.all([
        fetch(API.BILLING_PAYMENTS, { headers: { Authorization: 'Bearer ' + token } }),
        fetch(API.BILLING_PLAN_CHANGES, { headers: { Authorization: 'Bearer ' + token } })
      ]);
      
      const pJson = await pRes.json(); 
      const cJson = await cRes.json();
      
      if (!pRes.ok) throw new Error(pJson.error || t('billing.history.error.payments'));
      if (!cRes.ok) throw new Error(cJson.error || t('billing.history.error.planChanges'));
      
      setPayments(pJson.payments || []);
      setChanges(cJson.changes || []);
    } catch (e: any) {
      setError(e.message || t('billing.history.error.generic'));
    } finally { 
      setLoading(false); 
    }
  }, [getAccessToken, t]);

  useEffect(() => { 
    load(); 
  }, [load]);

  async function downgrade() {
    if (!confirm(t('billing.history.downgrade.confirm'))) return;
    
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
        push({ type: 'error', message: data.error || t('billing.history.downgrade.error') }); 
        return; 
      }
      
      push({ type: 'success', message: t('billing.history.downgrade.success') });
      window.dispatchEvent(new CustomEvent('entitlements:refresh'));
      load();
    } catch (e: any) {
      push({ type: 'error', message: e.message || t('billing.history.downgrade.error') });
    } finally { 
      setDowngrading(false); 
    }
  }

  function fmtCurrency(cents: number) {
    return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(cents / 100);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-4 pb-20 space-y-6">
      <SEO title={t('billing.history.seo.title')} description={t('billing.history.seo.desc')} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('billing.history.title')}</h1>
          <p className="text-gray-600 mt-1">Gerencie suas faturas e alterações de plano</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            onClick={load}
            className="flex items-center gap-2 border border-gray-300 hover:border-gray-400"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('billing.history.reload')}
          </Button>
          
          <Button
            disabled={downgrading}
            onClick={downgrade}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 text-white disabled:opacity-50"
          >
            {downgrading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {t('billing.history.downgrade.button')}
              </>
            )}
          </Button>
        </div>
      </div>

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

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <svg className="w-8 h-8 text-blue-500 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">{t('billing.history.loading')}</p>
          </div>
        </Card>
      )}

      {/* Content Grid */}
      {!loading && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Payments Section */}
          <Card className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-xl">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('billing.history.payments')}</h2>
                <p className="text-gray-600 text-sm">Histórico de pagamentos e faturas</p>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {payments.map(payment => (
                <div key={payment.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {payment.id.slice(0, 8)}...
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">{payment.plan_id}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {fmtCurrency(payment.amount_cents)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Criado: {formatDate(payment.created_at)}
                    </span>
                    {payment.processed_at && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Processado: {formatDate(payment.processed_at)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {payments.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('billing.history.empty.payments')}</h3>
                  <p className="text-gray-600 text-sm">Nenhum pagamento encontrado no histórico</p>
                </div>
              )}
            </div>
          </Card>

          {/* Plan Changes Section */}
          <Card className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-xl">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('billing.history.planChanges')}</h2>
                <p className="text-gray-600 text-sm">Alterações no seu plano</p>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {changes.map(change => (
                <div key={change.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          #{change.id}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 capitalize">
                          {change.reason}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-gray-500 line-through">{change.old_plan_id || '—'}</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="font-semibold text-gray-900">{change.new_plan_id}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(change.created_at)}
                    </span>
                  </div>
                </div>
              ))}
              
              {changes.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('billing.history.empty.planChanges')}</h3>
                  <p className="text-gray-600 text-sm">Nenhuma alteração de plano encontrada</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}