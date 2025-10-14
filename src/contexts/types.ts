export interface QuestionarioData {
  step: number;
  categoria: string;
  respostas: Record<string, string>;
}

export interface QuestionarioContextType {
  questionarioData: QuestionarioData;
  updateQuestionario: (data: Partial<QuestionarioData>) => void;
  clearQuestionario: () => void;
}

export const initialState: QuestionarioData = {
  step: 0,
  categoria: '',
  respostas: {},
};