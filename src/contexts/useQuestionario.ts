import { useContext } from 'react';
import { QuestionarioContext } from './QuestionarioContext';
import type { QuestionarioContextType } from './types';

export function useQuestionario(): QuestionarioContextType {
  const context = useContext(QuestionarioContext);
  if (context === undefined) {
    throw new Error('useQuestionario deve ser usado dentro de um QuestionarioProvider');
  }
  return context;
}