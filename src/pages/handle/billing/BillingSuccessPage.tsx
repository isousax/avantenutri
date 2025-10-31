import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SEO } from '../../../components/comum/SEO';
import { useAuth } from '../../../contexts/useAuth';
import { useI18n } from '../../../i18n/utils';
import { API } from '../../../config/api';

export default function BillingSuccessPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const paymentId = searchParams.get('payment_id');
  // Additional MP parameters (for reference but not used in this implementation)
  // const collectionId = searchParams.get('collection_id');
  // const collectionStatus = searchParams.get('collection_status'); 
  // const preferenceId = searchParams.get('preference_id');

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
        
        // If payment is approved, refresh the page after a delay to update user permissions
        if (data.status === 'approved') {
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2500);
        }
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>{t('billing.status.checking')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <SEO title={t('billing.success.seo.title')} description={t('billing.success.seo.desc')} />
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('billing.error.title')}</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => navigate('/pricing')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {t('billing.error.back')}
            </button>
          </>
        ) : paymentStatus?.status === 'approved' ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('billing.success.title')}</h1>
            <p className="text-gray-600 mb-2">{t('billing.success.message')}</p>
            {paymentStatus.purpose === 'consultation' && (
              <p className="text-sm text-gray-500 mb-4">
                Crédito gerado: {paymentStatus.consultation_type === 'avaliacao_completa' ? 'Avaliação Completa' : paymentStatus.consultation_type === 'reavaliacao' ? 'Reavaliação' : 'Consulta'}
              </p>
            )}
            <p className="text-sm text-gray-500 mb-6">{t('billing.success.redirecting')}</p>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              {t('billing.success.continue')}
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('billing.pending.title')}</h1>
            <p className="text-gray-600 mb-6">
              Status: {paymentStatus?.status || 'desconhecido'}
            </p>
            <div className="space-y-2 mb-6">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {t('billing.pending.refresh')}
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              >
                {t('billing.pending.dashboard')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}