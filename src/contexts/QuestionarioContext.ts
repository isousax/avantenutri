import { createContext } from 'react';
import type { QuestionarioContextType } from './types';

export const QuestionarioContext = createContext<QuestionarioContextType | undefined>(undefined);