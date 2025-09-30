import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts';
import { API } from '../config/api';

interface QuestionnaireAnalytics {
  overview: {
    total_users: number;
    completed_questionnaires: number;
    completion_rate: string;
  };
  categories: Array<{
    categoria: string;
    count: number;
  }>;
  recent_activity: Array<{
    date: string;
    count: number;
  }>;
  monthly_trends: Array<{
    month: string;
    count: number;
  }>;
}

export function useQuestionnaireAnalytics() {
  const { authenticatedFetch, user } = useAuth();

  return useQuery({
    queryKey: ['questionnaire-analytics'],
    queryFn: async (): Promise<QuestionnaireAnalytics> => {
      const response = await authenticatedFetch(API.ADMIN_QUESTIONNAIRE_ANALYTICS);
      if (!response.ok) {
        throw new Error('Failed to fetch questionnaire analytics');
      }
      return response.json();
    },
    enabled: !!user && user.role === 'admin',
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}