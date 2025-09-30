import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestionario } from '../../contexts/useQuestionario';
import Button from '../ui/Button';

interface QuestionnaireConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  hasQuestionnaire: boolean;
}

export const QuestionnaireConfirmModal: React.FC<QuestionnaireConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  hasQuestionnaire,
}) => {
  const navigate = useNavigate();
  const { questionarioData } = useQuestionario();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = () => {
    setIsUpdating(true);
    navigate('/questionario');
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const patientName = questionarioData?.respostas?.nome || 
    questionarioData?.respostas?.['Nome da criança'] || 
    'Paciente';

  const category = questionarioData?.categoria;
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'infantil': return 'Nutrição Infantil';
      case 'gestante': return 'Nutrição na Gestação';
      case 'adulto': return 'Nutrição Adulto/Idoso';
      case 'esportiva': return 'Nutrição Esportiva';
      default: return cat;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {hasQuestionnaire ? 'Confirmar dados da consulta' : 'Questionário necessário'}
          </h2>
        </div>

        {hasQuestionnaire ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              Confirme para quem é esta consulta e se os dados estão atualizados:
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Paciente:</span>
                <span className="text-gray-900">{patientName}</span>
              </div>
              {category && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Categoria:</span>
                  <span className="text-gray-900">{getCategoryLabel(category)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Última atualização:</span>
                <span className="text-gray-900">
                  {questionarioData?.respostas?.['updated_at'] || 'Há alguns dias'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleConfirm}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Confirmar e continuar
              </Button>
              
              <Button
                onClick={handleUpdate}
                variant="secondary"
                className="w-full"
                disabled={isUpdating}
              >
                {isUpdating ? 'Redirecionando...' : 'Atualizar dados antes'}
              </Button>
              
              <Button
                onClick={onClose}
                variant="secondary"
                className="w-full text-gray-600"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Para agendar uma consulta, você precisa completar o questionário inicial. 
              Isso nos ajuda a entender melhor suas necessidades nutricionais.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-amber-800">Informação importante</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    O questionário leva apenas alguns minutos para ser preenchido e é essencial 
                    para que possamos oferecer o melhor atendimento.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleUpdate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isUpdating}
              >
                {isUpdating ? 'Redirecionando...' : 'Preencher questionário'}
              </Button>
              
              <Button
                onClick={onClose}
                variant="secondary"
                className="w-full text-gray-600"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};