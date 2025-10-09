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
export const useGetQuestionnaire = () => {
  const authenticatedFetch = useAuthenticatedFetch();
  return useQuery({
    queryKey: ['questionnaire'],
    queryFn: async (): Promise<QuestionnaireResponse | null> => {
      try {
        // authenticatedFetch já retorna JSON; garantir formato esperado
        const data = await authenticatedFetch(
          API.QUESTIONNAIRE,
        );
        // Backend deve retornar objeto ou erro 404 (capturado e tratado)
        if (!data) return null;
        return data as QuestionnaireResponse;
      } catch (e: unknown) {
        // Se 404 ou não encontrado, tratamos como inexistente
        if (e instanceof Error && e.message?.includes('404')) return null;
        throw e; // outros erros sobem para permitir UI mostrar problema
      }
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
      // authenticatedFetch já lança em caso de !ok
      const data = await authenticatedFetch(API.QUESTIONNAIRE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: input.categoria,
          answers: input.respostas,
          submit: true,
        }),
      });
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
      const data = await authenticatedFetch(API.QUESTIONNAIRE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: partial.categoria,
            data: partial.respostas || {},
            is_complete: false,
        }),
      });
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