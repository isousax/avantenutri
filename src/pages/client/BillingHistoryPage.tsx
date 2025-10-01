import { useEffect, useState, useCallback } from 'react';
import { API } from '../../config/api';
import { useAuth } from '../../contexts/useAuth';
import { useI18n } from '../../i18n';
import { SEO } from '../../components/comum/SEO';
import { useToast } from '../../components/ui/ToastProvider';
import {
  ArrowLeft,
  RefreshCw,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
  Eye,
  Calendar,
  Hash
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

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

export default function BillingHistoryPage(){
  const { getAccessToken } = useAuth();
  const { locale, t } = useI18n();
  const { push } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async ()=> {
    setLoading(true); 
    setError(null);
    try {
      const token = await getAccessToken(); 
      if (!token) { 
        setError(t('auth.error.loginRequired')); 
        return; 
      }
      const pRes = await fetch(API.BILLING_PAYMENTS, { 
        headers: { Authorization: 'Bearer '+token }
      });
      const pJson = await pRes.json();
      if(!pRes.ok) throw new Error(pJson.error || t('billing.history.error.payments'));
      setPayments(pJson.payments || []);
    } catch (e:any) {
      setError(e.message || t('billing.history.error.generic'));
      push({ type: 'error', message: e.message || t('billing.history.error.generic') });
    } finally { 
      setLoading(false); 
    }
  }, [getAccessToken, t, push]);

  useEffect(()=> { load(); }, [load]);

  function fmtCurrency(cents:number){
    return new Intl.NumberFormat(locale==='pt'?'pt-BR':'en-US', { 
      style:'currency', 
      currency:'BRL'
    }).format(cents/100);
  }

  function getStatusConfig(status: string) {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'paid':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          label: 'Pago'
        };
      case 'pending':
      case 'processing':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: Clock,
          label: 'Pendente'
        };
      case 'failed':
      case 'cancelled':
      case 'declined':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: XCircle,
          label: 'Falhou'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: AlertTriangle,
          label: status
        };
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 safe-area-bottom">
      <SEO title={t('billing.history.seo.title')} description={t('billing.history.seo.desc')} />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-lg bg-white/95">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-95"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {t('billing.history.title')}
              </h1>
              <p className="text-sm text-gray-600">
                {payments.length} pagamentos registrados
              </p>
            </div>

            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Ações */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>Histórico completo de pagamentos</span>
          </div>
          
          <Button
            onClick={load}
            variant="secondary"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {t('billing.history.reload')}
          </Button>
        </div>

        {/* Estados de Loading e Error */}
        {loading && (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={32} className="animate-spin text-blue-500" />
              <p className="text-gray-600 font-medium">{t('billing.history.loading')}</p>
            </div>
          </Card>
        )}

        {error && !loading && (
          <Card className="p-6 border-l-4 border-red-500 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Erro ao carregar</h3>
                <p className="text-red-700 text-sm">{error}</p>
                <Button
                  onClick={load}
                  variant="secondary"
                  className="mt-3 flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  Tentar novamente
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Lista de Pagamentos */}
        {!loading && !error && (
          <div className="space-y-4">
            {payments.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <CreditCard size={24} className="text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {t('billing.history.empty.payments')}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Nenhum pagamento encontrado no seu histórico
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              payments.map((payment) => {
                const statusConfig = getStatusConfig(payment.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <Card 
                    key={payment.id} 
                    className={`p-5 border-l-4 ${statusConfig.borderColor} hover:shadow-md transition-all duration-200`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 ${statusConfig.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <StatusIcon size={20} className={statusConfig.color} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {payment.plan_id}
                            </h3>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Hash size={14} />
                              <span className="font-mono">{payment.id.slice(0,8)}...</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{formatDate(payment.created_at)}</span>
                            </div>
                          </div>

                          {payment.status_detail && (
                            <div className="mt-2 text-xs text-gray-500">
                              Detalhe: {payment.status_detail}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl font-bold text-gray-900 mb-1">
                          {fmtCurrency(payment.amount_cents)}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {payment.currency}
                        </div>
                      </div>
                    </div>

                    {/* Informações Adicionais */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {payment.external_id && (
                          <div className="flex items-center gap-1">
                            <CreditCard size={14} />
                            <span>ID externo: {payment.external_id}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Baixar recibo"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Data de processamento */}
                    {payment.processed_at && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle size={12} />
                          <span>
                            {t('billing.history.processedAt')}: {formatDate(payment.processed_at)}
                          </span>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Resumo Estatístico */}
        {payments.length > 0 && (
          <Card className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-purple-50 border-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{payments.length}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {payments.filter(p => 
                    ['approved', 'completed', 'paid'].includes(p.status.toLowerCase())
                  ).length}
                </div>
                <div className="text-sm text-gray-600">Concluídos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {payments.filter(p => 
                    ['pending', 'processing'].includes(p.status.toLowerCase())
                  ).length}
                </div>
                <div className="text-sm text-gray-600">Pendentes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {payments.filter(p => 
                    ['failed', 'cancelled', 'declined'].includes(p.status.toLowerCase())
                  ).length}
                </div>
                <div className="text-sm text-gray-600">Com erro</div>
              </div>
            </div>
          </Card>
        )}

        {/* Informações de Ajuda */}
        <Card className="mt-6 p-5 bg-gray-50 border-0">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Precisa de ajuda com um pagamento?</h4>
              <p className="text-gray-600 text-sm mb-3">
                Em caso de problemas com pagamentos, entre em contato com nosso suporte.
              </p>
              <Button variant="secondary">
                Entrar em contato
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}