import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts';
import { API } from '../config/api';

interface QuestionnaireStatus {
  is_complete: boolean;
  has_data: boolean;
}

export function useQuestionnaireStatus() {
  const { authenticatedFetch, user } = useAuth();

  return useQuery({
    queryKey: ['questionnaire-status'],
    queryFn: async (): Promise<QuestionnaireStatus> => {
      const endpoint = API.QUESTIONNAIRE_STATUS.replace(import.meta.env.VITE_API_URL || 'https://login-service.avantenutri.workers.dev', '');
      const response = await authenticatedFetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch questionnaire status');
      }
      const data = await response.json();
      return {
        is_complete: data.is_complete || false,
        has_data: data.has_data || false,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}