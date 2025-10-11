// Tipos para dieta estruturada

export type MealKey = 'cafe_manha' | 'almoco' | 'lanche_tarde' | 'jantar' | 'ceia';

export interface MealItemAlternative {
  alimentoId: string; // referencia a ALIMENTOS
  quantidade: number; // em gramas (base 100g) ou mesma unidade da porção padrão
}

export interface MealItem {
  id: string;
  alimentoId: string;
  quantidade: number; // gramas
  alternativas?: MealItemAlternative[]; // opções de substituição
  observacao?: string;
}

export interface MealBlock {
  key: MealKey;
  titulo: string;
  itens: MealItem[];
  observacao?: string;
}

export interface StructuredDietData {
  versao: 1;
  meals: MealBlock[];
  total?: {
    calorias: number;
    proteina: number;
    carboidratos: number;
    gordura: number;
  };
  // Snapshot flexível do questionário no momento da criação/revisão
  questionnaire?: {
    category?: string | null;
    answers?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
  };
}

export const MEAL_DEFS: { key: MealKey; titulo: string }[] = [
  { key: 'cafe_manha', titulo: 'Café da Manhã' },
  { key: 'almoco', titulo: 'Almoço' },
  { key: 'lanche_tarde', titulo: 'Lanche da Tarde' },
  { key: 'jantar', titulo: 'Jantar' },
  { key: 'ceia', titulo: 'Ceia' },
];
