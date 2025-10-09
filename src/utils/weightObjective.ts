export type WeightObjective = 'gain' | 'lose' | 'maintain';

// Tolerância padrão para considerar manutenção em variações pequenas
export const WEIGHT_TOLERANCE_KG = 0.3;

/**
 * Infere o objetivo do usuário em relação ao peso com base na meta e no peso atual.
 * Usa uma tolerância (kg) para considerar pequenas variações como manutenção.
 */
export function inferWeightObjective(goalKg: number | null | undefined, currentKg: number | null | undefined, toleranceKg = WEIGHT_TOLERANCE_KG): WeightObjective {
  if (goalKg == null || !isFinite(goalKg) || currentKg == null || !isFinite(currentKg)) return 'maintain';
  if (goalKg > currentKg + toleranceKg) return 'gain';
  if (goalKg < currentKg - toleranceKg) return 'lose';
  return 'maintain';
}

/**
 * Decide classe de cor para uma variação (diffKg) dada o objetivo.
 * - gain: aumento é verde, queda é vermelho
 * - lose: queda é verde, aumento é vermelho
 * - maintain: |Δ| < tolerance → cinza; caso contrário, âmbar (atenção)
 */
export function colorForWeightDiff(objective: WeightObjective, diffKg: number | null | undefined, toleranceKg = WEIGHT_TOLERANCE_KG): string {
  if (diffKg == null || !isFinite(diffKg)) return '';
  const change = diffKg as number;
  if (objective === 'gain') return change >= 0 ? 'text-green-600' : 'text-red-600';
  if (objective === 'lose') return change >= 0 ? 'text-red-600' : 'text-green-600';
  return Math.abs(change) < toleranceKg ? 'text-gray-600' : 'text-amber-600';
}

/**
 * Badge (bg + text) para situação atual vs meta para um dado registro individual
 * Retorna classes Tailwind.
 */
export function badgeForCurrentVsGoal(objective: WeightObjective, isAboveGoal: boolean): string {
  if (objective === 'gain') return isAboveGoal ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  if (objective === 'lose') return isAboveGoal ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
  return 'bg-amber-100 text-amber-700';
}
