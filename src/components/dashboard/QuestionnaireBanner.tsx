import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestionnaireStatus } from '../../hooks/useQuestionnaireStatus';
import { useI18n } from '../../i18n';

const BANNER_DISMISSAL_KEY = 'questionnaire-banner-dismissed';
const BANNER_DISMISSAL_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const QuestionnaireBanner: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data: status, isLoading, isError } = useQuestionnaireStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Só considera o dismissal do localStorage depois que a API confirmar status
    if (!status || isLoading || isError) return;
    if (status.is_complete) return; // se completo, não precisa checar dismiss
    const dismissedAt = localStorage.getItem(BANNER_DISMISSAL_KEY);
    if (dismissedAt) {
      const dismissTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissTime < BANNER_DISMISSAL_DURATION) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(BANNER_DISMISSAL_KEY);
      }
    }
  }, [status, isLoading, isError]);

  const handleDismiss = () => {
    // Persistir o dismissal apenas quando a API afirmar que ainda falta completar
    if (status && !status.is_complete) {
      localStorage.setItem(BANNER_DISMISSAL_KEY, Date.now().toString());
    }
    setIsDismissed(true);
  };

  const handleComplete = () => {
    navigate('/questionario');
  };

  // Não mostrar enquanto carrega, em erro (não conseguimos confirmar), se dismiss recente, ou se completo
  if (isLoading || isError || isDismissed || status?.is_complete) {
    return null;
  }

  const isFirstTime = !status?.has_data;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-800 mb-1">
                {isFirstTime ? t('questionnaire.banner.title.first') : t('questionnaire.banner.title.incomplete')}
              </h3>
              <p className="text-sm text-amber-700 mb-3">
                {isFirstTime 
                  ? t('questionnaire.banner.message.first')
                  : t('questionnaire.banner.message.incomplete')
                }
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleComplete}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {isFirstTime ? t('questionnaire.banner.button.start') : t('questionnaire.banner.button.complete')}
                </button>
                
                <button
                  onClick={handleDismiss}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors duration-200"
                >
                  {t('questionnaire.banner.button.later')}
                </button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 ml-4 text-amber-400 hover:text-amber-600 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};