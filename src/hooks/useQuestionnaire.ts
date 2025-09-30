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
        const response = await authenticatedFetch(API.QUESTIONNAIRE.replace(import.meta.env.VITE_API_URL || 'https://api.avantenutri.com.br', ''));
        return response;
      } catch (error) {
        // Se não existe questionário, retorna null
        return null;
      }
    },
    retry: false,
  });
};

// Hook para salvar questionário
export const useSaveQuestionnaire = () => {
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: QuestionnaireData): Promise<QuestionnaireResponse> => {
      const response = await authenticatedFetch(API.QUESTIONNAIRE.replace(import.meta.env.VITE_API_URL || 'https://api.avantenutri.com.br', ''), {
        method: 'POST',
        body: JSON.stringify({
          categoria: data.categoria,
          data: data.respostas,
          is_complete: true
        }),
      });
      return response;
    },
    onSuccess: () => {
      // Invalidar cache do questionário e status
      queryClient.invalidateQueries({ queryKey: ['questionnaire'] });
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
    mutationFn: async (data: Partial<QuestionnaireData>): Promise<QuestionnaireResponse> => {
      const response = await authenticatedFetch(API.QUESTIONNAIRE.replace(import.meta.env.VITE_API_URL || 'https://api.avantenutri.com.br', ''), {
        method: 'POST',
        body: JSON.stringify({
          categoria: data.categoria,
          data: data.respostas || {},
          is_complete: false
        }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaire'] });
      queryClient.invalidateQueries({ queryKey: ['questionnaire-status'] });
    },
  });
};