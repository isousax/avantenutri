import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '../config/api';
import { useAuth } from '../contexts/useAuth';

export interface AdminUserCreditsRow {
  user_id: string;
  name?: string;
  email?: string;
  avaliacao_completa: { available: number; used: number; expired: number };
  reavaliacao: { available: number; used: number; expired: number };
  updated_at: string;
}

interface FetchResponse { ok: boolean; rows: AdminUserCreditsRow[] }

export function useAdminCredits() {
  const { getAccessToken } = useAuth();
  return useQuery<FetchResponse>({
    queryKey: ['adminCredits'],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('no_token');
      // Reutilizando endpoint summary - assumimos que backend pode aceitar ?all_by_user=1
      const res = await fetch(`${API.CONSULTATION_CREDITS_SUMMARY}?all_by_user=1`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('fetch_failed');
      return res.json();
    },
    staleTime: 60_000,
  });
}

export function useAdjustCredits() {
  const { getAccessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { userId: string; type: 'avaliacao_completa' | 'reavaliacao'; delta: number; reason?: string }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('no_token');
      const res = await fetch(`${API.CONSULTATION_CREDITS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'adjust', ...vars }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'adjust_failed');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminCredits'] });
      qc.invalidateQueries({ queryKey: ['consultationCreditsSummary'] });
    }
  });
}
