import { useMealData } from './useMealData';

// Hook utilitário para obter apenas o snapshot do dia atual (1 dia) reutilizando o cache existente.
export function useMealToday() {
  const meal = useMealData(1);
  const today = meal.summary?.days?.[0];
  return {
    loading: meal.loading,
    error: meal.error,
    today,
    goals: meal.goals,
    progress: meal.progress,
  };
}
