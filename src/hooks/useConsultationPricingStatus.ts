import { useQuery } from '@tanstack/react-query';
import { API } from '../config/api';

interface PricingStatusResponse { ok: boolean; hash: string; count: number; last_updated?: string | null; }

export function useConsultationPricingStatus() {
  return useQuery<PricingStatusResponse>({
    queryKey: ['consultationPricingStatus'],
    queryFn: async () => {
      const res = await fetch(API.CONSULTATION_PRICING_STATUS, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('failed_pricing_status');
      return res.json();
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
