import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedFetch } from './useApi';
import { API } from '../config/api';
import { useAuth } from '../contexts';

export interface QuestionnaireData {
  categoria: string;
  respostas: Record<string, string>;
}

export interface QuestionnaireResponse {
  id: string;
  user_id: string;
  categoria: string;
  data: Record<string, string>;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

// Hook para buscar questionário do usuário
type ApiErrorShape = { error?: string; message?: string; detail?: string };
const getApiErrorMessage = (data: unknown, fallback: string): string => {
  if (data && typeof data === 'object') {
    const d = data as ApiErrorShape;
    return d.error || d.message || d.detail || fallback;
  }
  return fallback;
};

export const useGetQuestionnaire = () => {
  const authenticatedFetch = useAuthenticatedFetch();
  return useQuery({
    queryKey: ['questionnaire'],
    queryFn: async (): Promise<QuestionnaireResponse | null> => {
      const res = await authenticatedFetch(API.QUESTIONNAIRE);
      let data: unknown = null;
      try { data = await res.json(); } catch { /* sem dados ou inválido */ }
      if (!res.ok) {
        // 404: não há questionário salvo ainda → tratamos como null
        if (res.status === 404) return null;
        const msg = getApiErrorMessage(data, `Erro ${res.status}`);
        throw new Error(msg);
      }
      return (data || null) as QuestionnaireResponse | null;
    },
    retry: 1,
  });
};

// Hook para salvar questionário
export const useSaveQuestionnaire = () => {
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: QuestionnaireData): Promise<QuestionnaireResponse> => {
      const res = await authenticatedFetch(API.QUESTIONNAIRE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: input.categoria,
          answers: input.respostas,
          submit: true,
        }),
      });
      const data: unknown = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(getApiErrorMessage(data, 'Falha ao salvar questionário'));
      return data as QuestionnaireResponse;
    },
    onSuccess: (data) => {
      // Atualiza cache imediatamente para evitar segundo loading
      queryClient.setQueryData(['questionnaire'], data);
      // Garante que o status do questionário para o usuário atual seja atualizado imediatamente
      if (user?.id) {
        queryClient.setQueryData(['questionnaire-status', user.id], {
          is_complete: true,
          has_data: true,
        });
        queryClient.invalidateQueries({ queryKey: ['questionnaire-status', user.id] });
      } else {
        // Invalida genericamente caso o id não esteja disponível por algum motivo
        queryClient.invalidateQueries({ queryKey: ['questionnaire-status'], exact: false });
      }
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
    },
  });
};

// Hook para salvar rascunho do questionário (is_complete: false)
export const useSaveQuestionnaireDraft = () => {
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (partial: Partial<QuestionnaireData>): Promise<QuestionnaireResponse> => {
      const res = await authenticatedFetch(API.QUESTIONNAIRE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: partial.categoria,
            data: partial.respostas || {},
            is_complete: false,
        }),
      });
      const data: unknown = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(getApiErrorMessage(data, 'Falha ao salvar rascunho'));
      return data as QuestionnaireResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['questionnaire'], data);
      if (user?.id) {
        // Draft implica has_data: true, is_complete pode ser falso
        queryClient.setQueryData(['questionnaire-status', user.id], (prev: { is_complete?: boolean; has_data?: boolean } | undefined) => ({
          is_complete: false,
          has_data: true,
          ...(prev || {}),
        }));
        queryClient.invalidateQueries({ queryKey: ['questionnaire-status', user.id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['questionnaire-status'], exact: false });
      }
    },
  });
};