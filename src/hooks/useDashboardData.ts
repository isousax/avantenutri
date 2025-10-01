import { useWeightData } from './useWeightData';
import { useWaterData } from './useWaterData';
import { useMealData } from './useMealData';
import { useDietAdherence } from './useDietAdherence';
import { useMemo } from 'react';

/**
 * Hook agregado para centralizar as queries principais do dashboard
 * Evita múltiplos imports espalhados e facilita prefetch/SSR futuramente.
 */
export function useDashboardData(options?: { weightDays?: number; waterDays?: number; mealDays?: number; adherenceDays?: number; }) {
  const weight = useWeightData(options?.weightDays ?? 30);
  const water = useWaterData(options?.waterDays ?? 7);
  const meals = useMealData(options?.mealDays ?? 7);
  const { adherence } = useDietAdherence(options?.adherenceDays ?? 7);

  const loading = weight.loading || water.loading || meals.loading;
  const error = weight.error || water.error || meals.error;

  const goalsProgress = useMemo(() => ({
    weight: { current: weight.latest?.weight_kg ?? null, goal: weight.goal },
    water: { current: water.totalToday, goal: water.dailyGoalCups },
    meals: { progress: meals.progress, goals: meals.goals },
    adherence,
  }), [weight.latest, weight.goal, water.totalToday, water.dailyGoalCups, meals.progress, meals.goals, adherence]);

  return {
    weight, water, meals, adherence, loading, error, goalsProgress,
  };
}