import { useCallback, useEffect, useState } from 'react';
import { useMealData } from './useMealData';

export interface DietAdherence {
  percentage: number; // 0-100
  daysCovered: number; // quantos dias tiveram pelo menos uma refeição
  totalDays: number; // dias no período
  avgMealsPerDay: number;
  targetMealsPerDay: number; // meta sugerida (ex: 3-5 refeições)
}

export function useDietAdherence(days = 7): {
  adherence: DietAdherence | null;
  loading: boolean;
  error: string | null;
} {
  const mealData = useMealData(days);
  const summaryDays = mealData.summary?.days || [];
  const mealsLoading = mealData.loading;
  const mealsError = mealData.error as any as string | null;
  const [adherence, setAdherence] = useState<DietAdherence | null>(null);

  const calculateAdherence = useCallback(() => {
    if (!summaryDays || summaryDays.length === 0) {
      setAdherence(null);
      return;
    }

    const totalDays = days;
    const targetMealsPerDay = 4; // Meta sugerida: 4 refeições por dia
    
    // Dias que tiveram pelo menos uma refeição registrada
    const daysCovered = summaryDays.filter(day => day.count > 0).length;
    
    // Média de refeições por dia (considerando apenas dias com registros)
    const totalMeals = summaryDays.reduce((sum, day) => sum + day.count, 0);
    const avgMealsPerDay = daysCovered > 0 ? totalMeals / daysCovered : 0;
    
    // Cálculo da adesão baseado em:
    // 1. Cobertura de dias (50% do peso)
    // 2. Consistência nas refeições (50% do peso)
    const daysCoverage = (daysCovered / totalDays) * 100;
    const mealsConsistency = Math.min(100, (avgMealsPerDay / targetMealsPerDay) * 100);
    
    const percentage = Math.round((daysCoverage * 0.5) + (mealsConsistency * 0.5));

    setAdherence({
      percentage: Math.min(100, Math.max(0, percentage)),
      daysCovered,
      totalDays,
      avgMealsPerDay: Math.round(avgMealsPerDay * 10) / 10,
      targetMealsPerDay,
    });
  }, [summaryDays, days]);

  useEffect(() => {
    calculateAdherence();
  }, [calculateAdherence]);

  return {
    adherence,
    loading: mealsLoading,
    error: mealsError,
  };
}