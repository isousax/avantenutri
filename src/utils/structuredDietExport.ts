import type { StructuredDietData } from '../types/structuredDiet';

export function dietHasItems(data: StructuredDietData | null | undefined) {
  return !!data && data.meals.some(m => m.itens.length > 0);
}

export interface DietExportOptions { showAlternatives?: boolean }

export function copyDietJson(data: StructuredDietData) {
  try { void navigator.clipboard.writeText(JSON.stringify(data, null, 2)); } catch { /* noop */ }
}

