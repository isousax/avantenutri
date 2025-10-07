import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts';

export interface PaymentDetails {
  id: string;
  purpose?: string;
  consultation_type?: string;
  amount_cents: number;
  currency: string;
  status: string;
  status_detail?: string | null;
  payment_method?: string;
  external_id?: string | null;
  processed_at?: string | null;
  created_at: string;
  formatted_amount: string;
  service_description: string;
  status_description: string;
  formatted_date: string;
}

interface PaymentDetailsResponse { 
  payment?: PaymentDetails; 
  error?: string; 
}

export function usePaymentDetails(paymentId: string | null) {
  const { authenticatedFetch } = useAuth();

  const query = useQuery<PaymentDetailsResponse, Error, PaymentDetails | null>({
    queryKey: ['payment-details', paymentId],
    queryFn: async () => {
      if (!paymentId) throw new Error('Payment ID is required');
      
      const response = await authenticatedFetch(`/billing/payments/${paymentId}/details`);
      const data: PaymentDetailsResponse = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao carregar detalhes do pagamento');
      }
      
      return data;
    },
    select: (data) => data.payment || null,
    enabled: !!paymentId,
    staleTime: 1000 * 60 * 10, // 10 min
    gcTime: 1000 * 60 * 30, // 30 min
  });

  return {
    paymentDetails: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}