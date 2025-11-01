import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts';
import { API } from '../../config/api';

interface AdminQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
}

export const AdminQuestionnaireModal: React.FC<AdminQuestionnaireModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
}) => {
  const { authenticatedFetch } = useAuth();
  const [questionnaireData, setQuestionnaireData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Efeito para controlar o scroll do body quando o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      // Salva o estado atual do overflow
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Desabilita o scroll
      document.body.style.overflow = 'hidden';
      
      // Cleanup function - restaura o scroll quando o componente desmontar ou modal fechar
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchQuestionnaireData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await authenticatedFetch(`${API.ADMIN_USERS}/${userId}/questionnaire`);
        if (response.ok) {
          const data = await response.json();
          // Normaliza os campos para aceitar tanto pt quanto en
          if (data.answers && !data.respostas) data.respostas = data.answers;
          if (data.category && !data.categoria) data.categoria = data.category;
          setQuestionnaireData(data as Record<string, unknown>);
        } else if (response.status === 404) {
          setQuestionnaireData(null);
          setError('Este usuário ainda não preencheu o questionário.');
        } else {
          throw new Error('Erro ao carregar dados do questionário');
        }
      } catch (err: unknown) {
        setError((err instanceof Error ? err.message : 'Erro ao carregar dados do questionário'));
        setQuestionnaireData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaireData();
  }, [isOpen, userId, authenticatedFetch]);

  // Função para fechar o modal com tecla ESC
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'infantil': return 'Nutrição Infantil';
      case 'gestante': return 'Nutrição na Gestação';
      case 'adulto': return 'Nutrição Adulto/Idoso';
      case 'esportiva': return 'Nutrição Esportiva';
      default: return category;
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'Não informado';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }  

  const formatKey = (key: string): string => {
    // Convert camelCase or snake_case to readable format
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Extrai dados do questionário para renderização condicional
  let categoria: string | undefined;
  let updatedAt: string | undefined;
  let respostas: Record<string, unknown> = {};
  const isValidQuestionnaire = questionnaireData && typeof questionnaireData === 'object' && questionnaireData !== null;
  if (isValidQuestionnaire) {
    const qd = questionnaireData as Record<string, unknown>;
    categoria = String(qd.categoria ?? qd.category ?? '');
    updatedAt = String(qd.updated_at ?? qd.created_at ?? '');
    respostas = (qd.respostas ?? qd.answers ?? {}) as Record<string, unknown>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Dados do Questionário
            </h2>
            {userName && (
              <p className="text-sm text-gray-600 mt-1">
                Usuário: {userName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
            aria-label="Fechar modal"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-600">Carregando dados...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {isValidQuestionnaire && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-blue-900">Categoria</h3>
                    <p className="text-blue-800">{getCategoryLabel(categoria ?? '')}</p>
                  </div>
                  {updatedAt && (
                    <div>
                      <h3 className="font-semibold text-blue-900">Última Atualização</h3>
                      <p className="text-blue-800">
                        {new Date(updatedAt).toLocaleDateString('pt-BR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Questionnaire Responses */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Respostas do Questionário</h3>
                <div className="grid gap-4">
                  {Object.entries(respostas).map(([key, value]) => {
                    if (key.startsWith('_') || key === 'created_at' || key === 'updated_at') return null;
                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="md:col-span-1">
                            <h4 className="font-bold text-gray-700">{formatKey(key)}</h4>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {formatValue(value)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};