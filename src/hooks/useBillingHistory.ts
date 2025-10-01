import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API } from '../config/api';
import { useAuth } from '../contexts';

export interface Payment {
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

interface PaymentsResponse { payments?: Payment[]; error?: string; }

export function useBillingHistory() {
  const { authenticatedFetch } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<PaymentsResponse, Error, Payment[]>({
    queryKey: ['billing','payments'],
    queryFn: async () => {
      const r = await authenticatedFetch(API.BILLING_PAYMENTS);
      // authenticatedFetch já faz json(); adaptamos shape
      return r as PaymentsResponse;
    },
    select: (data) => data.payments || [],
    staleTime: 1000 * 60 * 5, // 5 min evita refetch agressivo ao navegar
    gcTime: 1000 * 60 * 30, // manter por 30 min em memória
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: (query) => query.state.data == null, // só refetch se não tiver cache
  });

  const refetch = () => query.refetch();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['billing','payments'] });

  return {
    payments: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch,
    invalidate,
    isFetching: query.isFetching,
  };
}

export function prefetchBillingHistory(qc: ReturnType<typeof useQueryClient>, fetcher: (input: RequestInfo, init?: RequestInit)=>Promise<Response>) {
  qc.prefetchQuery({
    queryKey: ['billing','payments'],
    queryFn: async () => {
      const r = await fetcher(API.BILLING_PAYMENTS);
      const data: PaymentsResponse = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.error || 'Falha ao carregar pagamentos');
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
