import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestionario } from '../../contexts/useQuestionario';
import Button from '../ui/Button';
import { useI18n } from '../../i18n/utils';

interface QuestionnaireConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isComplete: boolean;
  hasQuestionnaireData: boolean;
}

export const QuestionnaireConfirmModal: React.FC<QuestionnaireConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isComplete,
  hasQuestionnaireData,
}) => {
  const navigate = useNavigate();
  const { questionarioData } = useQuestionario();
  const [isUpdating, setIsUpdating] = useState(false);
  const { t } = useI18n();

  // Bloqueio de scroll ao abrir modal
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      // Compensar possível barra de scroll para evitar layout shift
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = scrollBarWidth + 'px';
      }
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdate = () => {
    setIsUpdating(true);
    navigate('/questionario');
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const category = questionarioData?.categoria;
  
  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      'infantil': '👶 Nutri Infantil',
      'gestante': '🤰 Nutri na Gestação',
      'adulto': '🧑 Adulto/Idoso', 
      'esportiva': '🏃 Nutri Esportiva',
    };
    return labels[cat] || cat;
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      'infantil': 'bg-blue-100 text-blue-800 border-blue-200',
      'gestante': 'bg-pink-100 text-pink-800 border-pink-200',
      'adulto': 'bg-green-100 text-green-800 border-green-200',
      'esportiva': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[cat] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatUpdatedRelative = (value?: string) => {
    if (!value) return 'Nunca';
    
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return value;
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'agora mesmo';
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    if (diffHours < 24) return `há ${diffHours} h`;
    if (diffDays === 1) return 'há 1 dia';
    if (diffDays < 7) return `há ${diffDays} dias`;
    if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} sem`;
    
    return d.toLocaleDateString('pt-BR');
  };

  const rawUpdated = questionarioData?.respostas?.['updated_at'];
  const showReview = isComplete && hasQuestionnaireData;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${
              showReview ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {showReview ? (
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {showReview ? 'Dados da Consulta' : 'Questionário Necessário'}
              </h2>
              <p className="text-gray-600 text-xs mt-1">
                {showReview 
                  ? 'Revise suas informações antes de agendar' 
                  : 'Complete as informações para continuar'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {showReview ? (
            <>
              {/* Resumo dos Dados */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-gray-300">
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('questionnaire.modal.category')}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(category || '')}`}>
                    {getCategoryLabel(category || '').split(' ').slice(1).join(' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-gray-300">
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Última Atualização</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatUpdatedRelative(rawUpdated)}
                  </span>
                </div>
              </div>

              {/* Ação de Atualização */}
              <button
                onClick={handleUpdate}
                className="w-full flex items-center justify-center gap-2 p-0 text-blue-600 group hover:scale-105 transition-transform duration-300"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-medium">{t('questionnaire.modal.updateButton')}</span>
              </button>
            </>
          ) : (
            <>
              {/* Instruções para Preenchimento */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Informações Necessárias</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Para oferecer o melhor atendimento, precisamos conhecer melhor 
                    seus objetivos e necessidades nutricionais.
                  </p>
                </div>
              </div>

              {/* Benefícios */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-900">Por que isso é importante?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        Atendimento personalizado às suas necessidades
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        Plano nutricional mais eficiente
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        Menos de 2 minutos para preencher
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-100 space-y-3">
          {showReview ? (
            <>
              <Button
                onClick={handleConfirm}
                className="w-full flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirmar e Agendar
              </Button>
              <Button
                onClick={onClose}
                variant="secondary"
                className="w-full text-sm"
                noBackground
                noBorder
                noFocus
              >
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg shadow-blue-500/25"
              >
                {isUpdating ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redirecionando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Preencher Questionário
                  </div>
                )}
              </Button>
              <Button
                onClick={onClose}
                variant="secondary"
                className="w-full border-gray-300 hover:border-gray-400 text-gray-700"
                noBackground
                noBorder
                noFocus
              >
                Voltar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// CSS Animation (adicionar ao seu arquivo CSS global)
// @keyframes scale-in {
//   from {
//     opacity: 0;
//     transform: scale(0.9);
//   }
//   to {
//     opacity: 1;
//     transform: scale(1);
//   }
// }
// 
// .animate-scale-in {
//   animation: scale-in 0.2s ease-out;
// }