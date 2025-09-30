import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { useQuestionnaireStatus } from './useQuestionnaireStatus';

export function useFirstLoginRedirect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: questionnaireStatus } = useQuestionnaireStatus();

  useEffect(() => {
    if (!user || !questionnaireStatus) return;

    // Check if this is the first login and questionnaire is not completed
    const isFirstLogin = localStorage.getItem('first_login_redirect_dismissed') !== 'true';
    const shouldRedirect = isFirstLogin && !questionnaireStatus.is_complete;

    if (shouldRedirect) {
      // Show dismissible prompt for questionnaire
      const shouldRedirectToQuestionnaire = window.confirm(
        'Bem-vindo(a)! Para uma melhor experiência, recomendamos que você complete o questionário inicial. Isso nos ajudará a personalizar seu atendimento.\n\nDeseja preencher agora?'
      );

      if (shouldRedirectToQuestionnaire) {
        navigate('/questionario');
      }

      // Mark as dismissed regardless of choice
      localStorage.setItem('first_login_redirect_dismissed', 'true');
    }
  }, [user, questionnaireStatus, navigate]);
}