import React, { useState, useEffect } from 'react';
import type { QuestionarioData } from './types';
import { initialState } from './types';
import { QuestionarioContext } from './QuestionarioContext';

export const QuestionarioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [questionarioData, setQuestionarioData] = useState<QuestionarioData>(() => {
    // Tenta recuperar dados do localStorage ao inicializar
    const savedData = localStorage.getItem('questionarioData');
    return savedData ? JSON.parse(savedData) : initialState;
  });

  // Salva no localStorage sempre que os dados mudarem
  useEffect(() => {
    localStorage.setItem('questionarioData', JSON.stringify(questionarioData));
  }, [questionarioData]);

  const updateQuestionario = (data: Partial<QuestionarioData>) => {
    setQuestionarioData(prev => ({ ...prev, ...data }));
  };

  const clearQuestionario = () => {
    setQuestionarioData(initialState);
    localStorage.removeItem('questionarioData');
  };

  return (
    <QuestionarioContext.Provider value={{ questionarioData, updateQuestionario, clearQuestionario }}>
      {children}
    </QuestionarioContext.Provider>
  );
};