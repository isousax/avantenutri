import { API } from '../config/api';
import { useAuth } from '../contexts/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useI18n } from '../i18n';

export interface Consultation {
  id: string;
  type: string;
  status: string;
  scheduled_at: string;
  duration_min: number;
  urgency?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

interface ListResponse { ok?: boolean; results?: Consultation[] }
interface CreateResponse { ok?: boolean; id?: string; status?: string; error?: string }

export function useConsultations() {
  const { getAccessToken } = useAuth();
  const qc = useQueryClient();
  const { t } = useI18n();

  const fetchConsultations = useCallback(async (): Promise<Consultation[]> => {
    const accessToken = await getAccessToken();
    if (!accessToken) return [];
    const res = await fetch(API.CONSULTATIONS, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data: ListResponse = await res.json();
    if (!res.ok) {
      const errMsg = (data && typeof (data as { error?: string }).error === 'string')
        ? (data as { error?: string }).error!
        : 'erro';
      throw new Error(errMsg);
    }
    return data.results || [];
  }, [getAccessToken]);

  const consultationsQuery = useQuery<Consultation[], Error>({
    queryKey: ['consultations'],
    queryFn: fetchConsultations,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation<CreateResponse, Error, { scheduledAt: string; type: string; durationMin?: number; notes?: string; urgency?: string; }>(
    {
      mutationFn: async (input) => {
        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error('no-auth');
        const res = await fetch(API.CONSULTATIONS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(input),
        });
        const data: CreateResponse & { message?: string } = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'erro');
        return data;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['consultations'] });
      },
    }
  );

  interface CancelCtx { prev?: Consultation[] }
  const cancelMutation = useMutation<void, Error, { id: string; reason?: string }, CancelCtx>({
    mutationFn: async ({ id, reason }) => {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('no-auth');
      const res = await fetch(API.consultationCancel(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        let msg = 'erro';
        try {
          const data = await res.json();
          if (data?.error === 'cancellation_window') {
            msg = t('consultations.cancel.window_hint');
          } else if (typeof data?.error === 'string') {
            msg = data.error;
          }
  } catch { /* ignore parse error */ }
        throw new Error(msg);
      }
    },
    onMutate: async ({ id }): Promise<CancelCtx> => {
      await qc.cancelQueries({ queryKey: ['consultations'] });
      const prev = qc.getQueryData<Consultation[]>(['consultations']);
      if (prev) {
        qc.setQueryData<Consultation[]>(['consultations'], prev.map(c => c.id === id ? { ...c, status: 'canceled' } : c));
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['consultations'], ctx.prev);
    },
    onSettled: () => {
      // Recarregar consultas e créditos, pois o cancelamento pode devolver crédito
      qc.invalidateQueries({ queryKey: ['consultations'] });
      qc.invalidateQueries({ queryKey: ['consultationCredits'] });
      qc.invalidateQueries({ queryKey: ['consultationCreditsSummary'] });
    },
  });

  return {
    items: consultationsQuery.data || [],
    loading: consultationsQuery.isLoading || consultationsQuery.isFetching,
    error: consultationsQuery.error ? (consultationsQuery.error.message || 'erro') : null,
    list: consultationsQuery.refetch,
    create: createMutation.mutateAsync,
    cancel: (id: string, reason?: string) => cancelMutation.mutateAsync({ id, reason }),
    creating: createMutation.isPending,
    canceling: cancelMutation.isPending,
  };
}
