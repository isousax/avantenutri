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
import {
  Search,
  Filter,
  RefreshCw,
  CreditCard,
  BarChart3,
  Webhook,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  DollarSign,
  Settings
} from 'lucide-react';

interface PaymentRow { 
  id: string; 
  user_id?: string;
  user_email?: string;
  first_name?: string;
  last_name?: string;
  purpose?: string;
  consultation_type?: string;
  amount_cents: number; 
  status: string; 
  status_detail?: string;
  payment_method?: string;
  installments?: number;
  external_id?: string;
  preference_id?: string;
  created_at: string; 
  processed_at?: string; 
  updated_at?: string;
}

interface ListPaymentsResp { 
  payments: PaymentRow[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface WebhookDelivery { 
  id: string; 
  event: string; 
  status: string; 
  received_at: string; 
  latency_ms?: number; 
  attempts?: number; 
}

const AdminBillingPage: React.FC = () => {
  const { authenticatedFetch } = useAuth();
  const { push } = useToast();
  const { locale, t } = useI18n();
  const [view, setView] = useState<'payments'|'webhooks'|'summary'>('payments');
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros & paginação
  const [payStatus, setPayStatus] = useState<string>('');
  const [payUser, setPayUser] = useState<string>('');
  const [payUserInput, setPayUserInput] = useState<string>('');
  const [payConsultType, setPayConsultType] = useState<string>('');
  const [payPage, setPayPage] = useState(1);
  const [payHasMore, setPayHasMore] = useState(false);
  const [payTotal, setPayTotal] = useState<number | null>(null);
  const PAGE_SIZE = 20;

  const [searchParams, setSearchParams] = useSearchParams();
  const initializedRef = useRef(false);
  
  // Pricing management state
  const [pricing, setPricing] = useState<{ type: string; amount_cents: number; currency: string; active: number; updated_at: string;}[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [pricingDirty, setPricingDirty] = useState<Record<string, number>>({});
  const [pricingActiveDirty, setPricingActiveDirty] = useState<Record<string, number>>({});

  // Ler querystring inicial
  useEffect(() => {
    if (initializedRef.current) return;
    const qView = searchParams.get('view');
    if (qView === 'payments' || qView === 'webhooks' || qView === 'summary') setView(qView);
    const qStatus = searchParams.get('status'); 
    if (qStatus) setPayStatus(qStatus);
    const qUser = searchParams.get('user'); 
    if (qUser) { setPayUser(qUser); setPayUserInput(qUser); }
    const qCt = searchParams.get('ctype'); 
    if (qCt) setPayConsultType(qCt);
    const qPage = Number(searchParams.get('page')||'1'); 
    if (qPage > 1) setPayPage(qPage);
    initializedRef.current = true;
  }, [searchParams]);

  // Atualizar querystring quando filtros mudarem
  useEffect(() => {
    if (!initializedRef.current) return;
    const params: Record<string,string> = { view };
    if (payStatus) params.status = payStatus;
    if (payUser) params.user = payUser;
    if (payConsultType) params.ctype = payConsultType;
    if (payPage > 1) params.page = String(payPage);
    setSearchParams(params, { replace: true });
  }, [view, payStatus, payUser, payConsultType, payPage, setSearchParams]);

  // Debounce campo user_id
  useEffect(() => {
    const id = setTimeout(() => {
      setPayUser(prev => prev === payUserInput ? prev : payUserInput);
      setPayPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [payUserInput]);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true); 
      setError(null);
      const qs: Record<string,string> = { 
        limit: String(PAGE_SIZE),
        offset: String((payPage - 1) * PAGE_SIZE)
      };
      if (payStatus) qs.status = payStatus; 
      if (payUser) qs.user_id = payUser;
      if (payConsultType) qs.consultation_type = payConsultType;
      
      const url = API.ADMIN_PAYMENTS + '?' + new URLSearchParams(qs).toString();
  const r = await authenticatedFetch(url, { method: 'GET', autoLogout: true });
  if (r.status === 401 || r.status === 403) { try { console.warn('[AdminBillingPage] fetch billing summary ->', r.status, 'autoLogout path'); } catch { /* noop */ } }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      
      const data: ListPaymentsResp = await r.json();
      setPayments(data.payments || []);
      
      if (data.pagination) {
        setPayHasMore(data.pagination.has_more);
        setPayTotal(data.pagination.total);
      } else {
        const len = (data.payments || []).length;
        setPayHasMore(len === PAGE_SIZE);
        setPayTotal(null);
      }
    } catch (e: unknown) { 
      const msg = e instanceof Error ? e.message : 'Erro';
      setError(msg); 
      push({ type: 'error', message: t('admin.billing.toast.loadPaymentsError') }); 
    } finally { 
      setLoading(false); 
    }
  }, [authenticatedFetch, payStatus, payUser, payConsultType, payPage, push, t]);

  const loadPricing = useCallback(async () => {
    try {
      setLoadingPricing(true);
      const r = await authenticatedFetch(API.ADMIN_CONSULTATION_PRICING, { 
        method: 'GET', 
        autoLogout: true 
      });
      if (!r.ok && (r.status === 401 || r.status === 403)) { try { console.warn('[AdminBillingPage] fetch pricing ->', r.status, 'autoLogout path'); } catch { /* noop */ } }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      setPricing(data.pricing || []);
    } catch { 
      push({ type: 'error', message: 'Falha ao carregar preços' }); 
    } finally { 
      setLoadingPricing(false); 
    }
  }, [authenticatedFetch, push]);

  const loadWebhooks = useCallback(async () => {
    setLoading(true); 
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 250));
      setWebhooks([
        { 
          id: 'wh_1', 
          event: 'payment.approved', 
          status: 'processed', 
          received_at: new Date(Date.now() - 3600_000).toISOString(), 
          latency_ms: 120, 
          attempts: 1 
        },
        { 
          id: 'wh_2', 
          event: 'payment.pending', 
          status: 'processed', 
          received_at: new Date(Date.now() - 7200_000).toISOString(), 
          latency_ms: 200, 
          attempts: 1 
        },
        { 
          id: 'wh_3', 
          event: 'payment.failed', 
          status: 'error', 
          received_at: new Date(Date.now() - 10800_000).toISOString(), 
          latency_ms: 350, 
          attempts: 2 
        },
      ]);
    } catch (e: unknown) { 
      const msg = e instanceof Error ? e.message : 'Erro';
      setError(msg); 
      push({ type: 'error', message: t('admin.billing.toast.loadWebhooksError') }); 
    } finally { 
      setLoading(false); 
    }
  }, [push, t]);

  // Carregar conforme view ou mudança de filtros
  useEffect(() => {
    if (view === 'payments') loadPayments();
  }, [view, loadPayments]);
  
  useEffect(() => { 
    if (view === 'webhooks') loadWebhooks(); 
  }, [view, loadWebhooks]);
  
  useEffect(() => { 
    if (view === 'summary') loadPricing(); 
  }, [view, loadPricing]);

  const currencyFmt = useCallback((cents: number) => 
    new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(cents / 100), 
  [locale]);

  const summary = useMemo(() => {
    const totalApproved = payments
      .filter(p => p.status === 'approved')
      .reduce((acc, p) => acc + p.amount_cents, 0);
    const totalPending = payments
      .filter(p => p.status === 'pending')
      .reduce((acc, p) => acc + p.amount_cents, 0);
    const byType: Record<string, number> = {};
    
    payments.forEach(p => { 
      const key = p.consultation_type || p.purpose || 'outro'; 
      if (!byType[key]) byType[key] = 0; 
      byType[key] += 1; 
    });
    
    return { totalApproved, totalPending, byType };
  }, [payments]);


  const clearFilters = (): void => {
    setPayStatus('');
    setPayUser('');
    setPayUserInput('');
    setPayConsultType('');
    setPayPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50/30 safe-area-bottom">
      <SEO 
        title={t('admin.billing.seo.title')} 
        description={t('admin.billing.seo.desc')} 
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 backdrop-blur-lg bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
          {/* Refresh Button - Mobile */}
          <div className="absolute top-4 right-4 sm:hidden">
            <Button
              type="button"
              variant="secondary"
              onClick={() => view === 'payments' ? loadPayments() : view === 'webhooks' ? loadWebhooks() : loadPricing()}
              disabled={loading}
              className="flex items-center gap-2"
              noBorder
              noFocus
              noBackground
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <CreditCard size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t('admin.billing.title')}
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  Gerencie pagamentos, preços e webhooks
                </p>
              </div>
            </div>

            {/* View Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-lg p-1">
              <Button
                type="button"
                variant={view === 'summary' ? 'primary' : 'secondary'}
                onClick={() => setView('summary')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm"
                noBorder
                noFocus
              >
                <BarChart3 size={14} />
                Resumo
              </Button>
              <Button
                type="button"
                variant={view === 'payments' ? 'primary' : 'secondary'}
                onClick={() => setView('payments')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm"
                noBorder
                noFocus
              >
                <CreditCard size={14} />
                Pagamentos
              </Button>
              {/*<Button
                type="button"
                variant={view === 'webhooks' ? 'primary' : 'secondary'}
                onClick={() => setView('webhooks')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm"
                noBorder
              >
                <Webhook size={14} />
                Webhooks
              </Button>*/}
            </div>

            {/* Refresh Button - Desktop */}
            <div className="hidden sm:flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => view === 'payments' ? loadPayments() : view === 'webhooks' ? loadWebhooks() : loadPricing()}
                disabled={loading}
                className="flex items-center gap-2"
                noBorder
                noFocus
                noBackground
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-6">
        {/* Filtros - Payments View */}
        {view === 'payments' && (
          <Card className="p-4 sm:p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Filter size={14} />
                    Status
                  </label>
                  <select 
                    value={payStatus} 
                    onChange={(e) => { setPayPage(1); setPayStatus(e.target.value); }} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos os status</option>
                    <option value="approved">Aprovado</option>
                    <option value="pending">Pendente</option>
                    <option value="failed">Falhou</option>
                  </select>
                </div>

                {/* User Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User size={14} />
                    User ID
                  </label>
                  <input 
                    value={payUserInput} 
                    onChange={(e) => setPayUserInput(e.target.value)} 
                    placeholder="Filtrar por User ID"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Consultation Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Settings size={14} />
                    Tipo
                  </label>
                  <select 
                    value={payConsultType} 
                    onChange={(e) => { setPayConsultType(e.target.value); setPayPage(1); }} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="avaliacao_completa">Avaliação</option>
                    <option value="reavaliacao">Reavaliação</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setPayPage(1);
                      loadPayments();
                    }}
                    className="flex items-center gap-2 flex-1"
                  >
                    <Search size={14} />
                    Buscar
                  </Button>

                  {(payStatus || payUser || payConsultType) && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={clearFilters}
                      className="flex items-center gap-2"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-4 border-l-4 border-red-500 bg-red-50 mb-6">
            <div className="flex items-start gap-3">
              <XCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-1">
                  Erro ao carregar dados
                </h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Summary View */}
        {view === 'summary' && (
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Card className="">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Aprovada</div>
                  <div className="text-xl font-semibold">
                    {loading ? <Skeleton className="h-6 w-24" /> : currencyFmt(summary.totalApproved)}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <CreditCard size={20} className="text-amber-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Pendentes</div>
                  <div className="text-xl font-semibold">
                    {loading ? <Skeleton className="h-6 w-20" /> : currencyFmt(summary.totalPending)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Pricing Management */}
            <Card className="p-6 col-span-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <DollarSign size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Preços de Consultas</h2>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={loadPricing} 
                  disabled={loadingPricing}
                  noBorder
                  noFocus
                  noBackground
                  className="flex items-center gap-2"
                >
                  <RefreshCw size={14} className={loadingPricing ? "animate-spin" : ""} />
                </Button>
              </div>

              {loadingPricing && <Skeleton lines={3} />}
              
              {!loadingPricing && pricing.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign size={32} className="mx-auto text-gray-300 mb-2" />
                  <p>Nenhum preço configurado</p>
                </div>
              )}
              
              {!loadingPricing && pricing.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-gray-200">
                        <th className="pb-3 font-semibold text-gray-700">Tipo</th>
                        <th className="pb-3 font-semibold text-gray-700">Valor (BRL)</th>
                        <th className="pb-3 font-semibold text-gray-700">Ativo</th>
                        <th className="pb-3 font-semibold text-gray-700">Atualizado</th>
                        <th className="pb-3 font-semibold text-gray-700"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricing.map(p => {
                        const edited = pricingDirty[p.type] != null || pricingActiveDirty[p.type] != null;
                        return (
                          <tr key={p.type} className="border-b border-gray-100 last:border-none hover:bg-gray-50/50">
                            <td className="py-3 font-medium text-gray-900">{p.type}</td>
                            <td className="py-3">
                              <input 
                                type="number" 
                                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                defaultValue={(p.amount_cents / 100).toFixed(2)} 
                                step="0.01" 
                                onChange={e => {
                                  const v = Math.round(parseFloat(e.target.value || '0') * 100);
                                  setPricingDirty(d => ({ ...d, [p.type]: v }));
                                }} 
                              />
                            </td>
                            <td className="py-3">
                              <input 
                                type="checkbox" 
                                defaultChecked={p.active === 1} 
                                onChange={e => setPricingActiveDirty(d => ({ ...d, [p.type]: e.target.checked ? 1 : 0 }))} 
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-3 text-xs text-gray-500">
                              {new Date(p.updated_at).toLocaleString(locale === 'pt' ? 'pt-BR' : 'en-US')}
                            </td>
                            <td className="py-3">
                              <Button 
                                type="button" 
                                disabled={!edited}
                                onClick={async () => {
                                  try {
                                    const amount = pricingDirty[p.type] ?? p.amount_cents;
                                    const active = pricingActiveDirty[p.type] ?? p.active;
                                    const r = await authenticatedFetch(API.ADMIN_CONSULTATION_PRICING, { 
                                      method: 'PUT', 
                                      headers: { 'Content-Type': 'application/json' }, 
                                      body: JSON.stringify({ type: p.type, amount_cents: amount, active }) 
                                    });
                                    if (!r.ok) throw new Error('fail');
                                    push({ type: 'success', message: 'Preço atualizado com sucesso' });
                                    setPricingDirty(d => { const clone = { ...d } as Record<string, number>; delete clone[p.type]; return clone as typeof d; });
                                    setPricingActiveDirty(d => { const clone = { ...d } as Record<string, number>; delete clone[p.type]; return clone as typeof d; });
                                    loadPricing();
                                  } catch { 
                                    push({ type: 'error', message: 'Falha ao salvar preço' }); 
                                  }
                                }}
                              >
                                Salvar
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Payments View */}
        {view === 'payments' && (
          <>
            {/* Desktop Table */}
            <Card className="p-0 overflow-hidden hidden lg:block">
              <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Pagamentos</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-4 text-left font-semibold text-gray-700">Pagamento</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Usuário</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Tipo</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Valor</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Status</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Método</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={7} className="p-4">
                          <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Skeleton key={i} lines={1} className="h-12" />
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                    {!loading && payments.map(p => (
                      <tr key={p.id} className="border-b border-gray-100 last:border-none hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-900 text-xs font-mono select-all">
                              {p.id}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              MP: {p.external_id || '—'}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-900">
                              {p.first_name} {p.last_name}
                            </div>
                            <div className="text-xs text-gray-500">{p.user_email}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                              {p.user_id?.slice(0, 8)}...
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {p.consultation_type || p.purpose || '—'}
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900">
                            {currencyFmt(p.amount_cents)}
                          </div>
                          {p.installments && p.installments > 1 && (
                            <div className="text-xs text-gray-500">
                              {p.installments}x
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              p.status === 'approved' ? 'bg-green-100 text-green-700' : 
                              p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                              'bg-red-100 text-red-700'
                            }`}>
                              {p.status}
                            </span>
                            {p.status_detail && (
                              <span className="text-xs text-gray-500">{p.status_detail}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {p.payment_method || '—'}
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {new Date(p.created_at).toLocaleString(locale === 'pt' ? 'pt-BR' : 'en-US')}
                        </td>
                      </tr>
                    ))}
                    {!loading && payments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-500">
                            <CreditCard size={48} className="text-gray-300" />
                            <div>
                              <div className="font-medium text-gray-900 mb-1">
                                Nenhum pagamento encontrado
                              </div>
                              <div className="text-sm">
                                Tente ajustar os filtros de busca
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile List */}
            <div className="space-y-3 lg:hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Pagamentos</h3>
              </div>

              {loading && (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="p-4">
                      <Skeleton lines={3} />
                    </Card>
                  ))}
                </div>
              )}

              {!loading && payments.map(p => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate text-sm mb-1">
                        {p.first_name} {p.last_name}
                      </div>
                      <div className="text-xs text-gray-500 truncate mb-2">
                        {p.user_email}
                      </div>
                      <div className="font-mono text-[10px] text-gray-400 select-all">
                        {p.id}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'approved' ? 'bg-green-100 text-green-700' : 
                      p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Valor</div>
                      <div className="font-medium">
                        {currencyFmt(p.amount_cents)}
                        {p.installments && p.installments > 1 && (
                          <span className="text-xs text-gray-500 ml-1">({p.installments}x)</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Tipo</div>
                      <div className="text-sm">{p.consultation_type || p.purpose || '—'}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(p.created_at).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US')}
                    </div>
                    <div>{p.payment_method || '—'}</div>
                  </div>
                </Card>
              ))}

              {!loading && payments.length === 0 && (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <CreditCard size={48} className="text-gray-300" />
                    <div>
                      <div className="font-medium text-gray-900 mb-1">
                        Nenhum pagamento encontrado
                      </div>
                      <div className="text-sm">
                        Tente ajustar os filtros de busca
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Pagination */}
            {payments.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Mostrando <span className="font-semibold">{payments.length}</span> pagamentos
                  {payTotal !== null && (
                    <> de <span className="font-semibold">{payTotal}</span> no total</>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={payPage === 1}
                    onClick={() => setPayPage(p => Math.max(1, p - 1))}
                    className="flex items-center gap-2"
                  >
                    Anterior
                  </Button>
                  <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium">
                    Página {payPage}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setPayPage(p => p + 1)}
                    disabled={!payHasMore}
                    className="flex items-center gap-2"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Webhooks View */}
        {view === 'webhooks' && (
          <>
            {/* Desktop Table */}
            <Card className="p-0 overflow-hidden hidden lg:block">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h3 className="font-semibold text-gray-900">Webhooks Recebidos</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-4 text-left font-semibold text-gray-700">ID</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Evento</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Status</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Recebido em</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Latência</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Tentativas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={6} className="p-4">
                          <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Skeleton key={i} lines={1} className="h-12" />
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                    {!loading && webhooks.map(w => (
                      <tr key={w.id} className="border-b border-gray-100 last:border-none hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-mono text-xs text-gray-900 select-all">
                            {w.id}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-mono text-xs text-gray-600">
                            {w.event}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            w.status === 'processed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {new Date(w.received_at).toLocaleString(locale === 'pt' ? 'pt-BR' : 'en-US')}
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {w.latency_ms != null ? `${w.latency_ms}ms` : '—'}
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {w.attempts ?? '—'}
                        </td>
                      </tr>
                    ))}
                    {!loading && webhooks.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-500">
                            <Webhook size={48} className="text-gray-300" />
                            <div>
                              <div className="font-medium text-gray-900 mb-1">
                                Nenhum webhook encontrado
                              </div>
                              <div className="text-sm">
                                Os webhooks aparecerão aqui quando recebidos
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-200 text-xs text-gray-500 bg-gray-50">
                {t('admin.billing.webhooks.mockNote')}
              </div>
            </Card>

            {/* Mobile List */}
            <div className="space-y-3 lg:hidden">
              <h3 className="font-semibold text-gray-900 mb-4">Webhooks Recebidos</h3>

              {loading && (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="p-4">
                      <Skeleton lines={3} />
                    </Card>
                  ))}
                </div>
              )}

              {!loading && webhooks.map(w => (
                <Card key={w.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-gray-900 select-all mb-2">
                        {w.id}
                      </div>
                      <div className="font-mono text-xs text-gray-600">
                        {w.event}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      w.status === 'processed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {w.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Recebido</div>
                      <div className="text-xs">
                        {new Date(w.received_at).toLocaleString(locale === 'pt' ? 'pt-BR' : 'en-US')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Latência</div>
                      <div className="text-xs">{w.latency_ms != null ? `${w.latency_ms}ms` : '—'}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3 mt-3">
                    <div>Tentativas: {w.attempts ?? '—'}</div>
                  </div>
                </Card>
              ))}

              {!loading && webhooks.length === 0 && (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <Webhook size={48} className="text-gray-300" />
                    <div>
                      <div className="font-medium text-gray-900 mb-1">
                        Nenhum webhook encontrado
                      </div>
                      <div className="text-sm">
                        Os webhooks aparecerão aqui quando recebidos
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="text-xs text-gray-500 mt-4">
                {t('admin.billing.webhooks.mockNote')}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminBillingPage;