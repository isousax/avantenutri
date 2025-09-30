import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SEO } from '../../../components/comum/SEO';
import { useAuth } from '../../../contexts/useAuth';
import { useI18n } from '../../../i18n';
import { API } from '../../../config/api';

export default function BillingPendingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const paymentId = searchParams.get('payment_id');

  const checkPaymentStatus = async () => {
    if (!paymentId) {
      setError('ID do pagamento não encontrado');
      setLoading(false);
      return;
    }

    setChecking(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError('Sessão expirada. Faça login novamente.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API.BILLING_STATUS}?payment_id=${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Erro ao verificar status do pagamento');
        return;
      }

      setPaymentStatus(data);
      
      // If payment is now approved, redirect to success
      if (data.status === 'approved') {
        navigate(`/billing/success?payment_id=${paymentId}`, { replace: true });
      }
    } catch (e) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    checkPaymentStatus();
  }, [paymentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p>{t('billing.status.checking')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <SEO title={t('billing.pending.title')} description="Aguardando confirmação do pagamento" />
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('billing.pending.title')}</h1>
        <p className="text-gray-600 mb-4">Aguardando confirmação do pagamento...</p>
        
        {error ? (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        ) : paymentStatus ? (
          <div className="text-sm text-gray-500 mb-4">
            <p>Status: {paymentStatus.status}</p>
            {paymentStatus.status_detail && (
              <p>Detalhes: {paymentStatus.status_detail}</p>
            )}
            {paymentStatus.payment_method && (
              <p>Método: {paymentStatus.payment_method}</p>
            )}
          </div>
        ) : null}
        
        <div className="space-y-2">
          <button 
            onClick={checkPaymentStatus}
            disabled={checking}
            className="w-full bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            {checking ? 'Verificando...' : t('billing.pending.refresh')}
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            {t('billing.pending.dashboard')}
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-6">
          Alguns métodos de pagamento podem levar alguns minutos para confirmação.
        </p>
      </div>
    </div>
  );
}