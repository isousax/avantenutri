import { useQuery } from '@tanstack/react-query';
import { API } from '../config/api';
import { useAuth } from '../contexts/useAuth';

export interface ConsultationCredit {
  id: string;
  type: 'avaliacao_completa' | 'reavaliacao' | 'only_diet';
  status: 'available' | 'used' | 'expired';
  payment_id?: string;
  consultation_id?: string;
  created_at: string;
  used_at?: string;
  expires_at?: string;
}

export interface ConsultationCreditsSummaryEntry {
  available: number; used: number; expired: number;
}
export type ConsultationCreditsSummary = Record<string, ConsultationCreditsSummaryEntry>;

export function useConsultationCredits(status: 'available' | 'used' | 'expired' | 'all' = 'available') {
  const { getAccessToken } = useAuth();
  return useQuery<{ ok: boolean; credits: ConsultationCredit[] }>({
    queryKey: ['consultationCredits', status],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('no_token');
      const res = await fetch(`${API.CONSULTATION_CREDITS}?status=${status}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('failed_fetch_credits');
      return res.json();
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useConsultationCreditsSummary() {
  const { getAccessToken } = useAuth();
  return useQuery<{ ok: boolean; summary: ConsultationCreditsSummary }>({
    queryKey: ['consultationCreditsSummary'],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('no_token');
      const res = await fetch(API.CONSULTATION_CREDITS_SUMMARY, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('failed_fetch_credits_summary');
      return res.json();
    },
    enabled: true,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
