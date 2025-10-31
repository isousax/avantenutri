import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SEO } from '../../../components/comum/SEO';
import { useAuth } from '../../../contexts/useAuth';
import { useI18n } from '../../../i18n/utils';
import { API } from '../../../config/api';

export default function BillingFailurePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    async function checkPaymentStatus() {
      if (!paymentId) {
        setError('ID do pagamento não encontrado');
        setLoading(false);
        return;
      }

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
      } catch (e) {
        setError('Erro de conexão');
      } finally {
        setLoading(false);
      }
    }

    checkPaymentStatus();
  }, [paymentId, getAccessToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>{t('billing.status.checking')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <SEO title={t('billing.failure.title')} description={t('billing.failure.message')} />
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('billing.failure.title')}</h1>
        <p className="text-gray-600 mb-2">{t('billing.failure.message')}</p>
        
        {error ? (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        ) : paymentStatus ? (
          <div className="text-sm text-gray-500 mb-4">
            <p>Status: {paymentStatus.status}</p>
            {paymentStatus.status_detail && (
              <p>Detalhes: {paymentStatus.status_detail}</p>
            )}
          </div>
        ) : null}
        
        <div className="space-y-2">
          <button 
            onClick={() => navigate('/agendar-consulta')}
            className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            {t('billing.failure.retry')}
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Ir para Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}