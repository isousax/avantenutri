import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedFetch } from './useApi';
import { API } from '../config/api';

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
      } catch (e: any) {
        // Se 404 ou não encontrado, tratamos como inexistente
        if (e?.message?.includes('404')) return null;
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

  return useMutation({
    mutationFn: async (input: QuestionnaireData): Promise<QuestionnaireResponse> => {
      // authenticatedFetch já lança em caso de !ok
      const data = await authenticatedFetch(API.QUESTIONNAIRE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: input.categoria,
          data: input.respostas,
          is_complete: true,
        }),
      });
      return data as QuestionnaireResponse;
    },
    onSuccess: (data) => {
      // Atualiza cache imediatamente para evitar segundo loading
      queryClient.setQueryData(['questionnaire'], data);
      queryClient.invalidateQueries({ queryKey: ['questionnaire-status'] });
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
    },
  });
};

// Hook para salvar rascunho do questionário (is_complete: false)
export const useSaveQuestionnaireDraft = () => {
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ['questionnaire-status'] });
    },
  });
};