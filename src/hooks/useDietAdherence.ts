import { useCallback, useEffect, useState } from 'react';
import { useMealData } from './useMealData';
import { useWaterData } from './useWaterData';
import { useWeightData } from './useWeightData';

export interface DietAdherence {
  percentage: number; // 0-100
  daysCovered: number; // quantos dias tiveram pelo menos uma refeição
  totalDays: number; // dias no período
  avgMealsPerDay: number;
  targetMealsPerDay: number; // meta sugerida (ex: 3-5 refeições)
  waterAdherence: number; // 0-100 adesão à meta de água
  weightTrackingDays: number; // dias com pesagem
  components: {
    meals: number; // % dos registros de refeições
    water: number; // % do cumprimento da meta de água
    consistency: number; // % da consistência (frequência de registros)
  };
}

interface MealDay {
  date: string;
  count: number;
}

interface WaterDay {
  date: string;
  total_ml: number;
}

export function useDietAdherence(days = 7): {
  adherence: DietAdherence | null;
  loading: boolean;
  error: string | null;
} {
  const mealData = useMealData(days);
  const waterData = useWaterData(days);
  const weightData = useWeightData(days);
  
  const mealsLoading = mealData.loading;
  const waterLoading = waterData.loading;
  const weightLoading = weightData.loading;
  
  const mealsError = mealData.error instanceof Error ? mealData.error.message : typeof mealData.error === 'string' ? mealData.error : null;
  const [adherence, setAdherence] = useState<DietAdherence | null>(null);

  const calculateAdherence = useCallback(() => {
    const summaryDays = mealData.summary?.days || [];
    
    if (summaryDays.length === 0) {
      setAdherence(null);
      return;
    }

    const totalDays = days;
    const targetMealsPerDay = 4; // Meta sugerida: 4 refeições por dia
    
    // ===== COMPONENTE 1: REGISTROS DE REFEIÇÕES =====
    // Dias que tiveram pelo menos uma refeição registrada
    const daysCovered = summaryDays.filter((day: MealDay) => day.count > 0).length;
    
    // Média de refeições por dia (considerando apenas dias com registros)
    const totalMeals = summaryDays.reduce((sum: number, day: MealDay) => sum + day.count, 0);
    const avgMealsPerDay = daysCovered > 0 ? totalMeals / daysCovered : 0;
    
    // Cobertura de dias (% de dias com pelo menos 1 refeição)
    const daysCoverage = (daysCovered / totalDays) * 100;
    
    // Consistência nas refeições (% da meta de refeições diárias)
    const mealsConsistency = Math.min(100, (avgMealsPerDay / targetMealsPerDay) * 100);
    
    // Score de refeições (média entre cobertura e consistência)
    const mealsScore = (daysCoverage + mealsConsistency) / 2;
    
    // ===== COMPONENTE 2: HIDRATAÇÃO =====
    let waterScore = 0;
    
    if (waterData.dailyGoalCups && waterData.dailyGoalCups > 0 && waterData.summaryDays) {
      const waterGoal = waterData.dailyGoalCups * (waterData.cupSize || 250); // Meta em ml
      
      // Calcular % de cumprimento da meta de água por dia
      const waterPercentages = waterData.summaryDays.map((day: WaterDay) => {
        const achieved = day.total_ml || 0;
        return Math.min(100, (achieved / waterGoal) * 100);
      });
      
      // Média de cumprimento da meta de água
      if (waterPercentages.length > 0) {
        waterScore = waterPercentages.reduce((sum: number, pct: number) => sum + pct, 0) / waterPercentages.length;
      }
    }
    
    // ===== COMPONENTE 3: CONSISTÊNCIA GERAL =====
    // Considerar pesagens como indicador de engajamento
    const weightTrackingDays = weightData.logs?.length ?? 0;
    const weightConsistency = Math.min(100, (weightTrackingDays / Math.max(totalDays, 7)) * 100);
    
    // ===== CÁLCULO FINAL =====
    // Pesos ajustados para diferentes componentes
    const mealsWeight = 0.6;    // 60% - Refeições são o principal
    const waterWeight = 0.25;   // 25% - Hidratação é importante
    const consistencyWeight = 0.15; // 15% - Engajamento geral
    
    const finalPercentage = Math.round(
      (mealsScore * mealsWeight) + 
      (waterScore * waterWeight) + 
      (weightConsistency * consistencyWeight)
    );

    setAdherence({
      percentage: Math.min(100, Math.max(0, finalPercentage)),
      daysCovered,
      totalDays,
      avgMealsPerDay: Math.round(avgMealsPerDay * 10) / 10,
      targetMealsPerDay,
      waterAdherence: Math.round(waterScore),
      weightTrackingDays,
      components: {
        meals: Math.round(mealsScore),
        water: Math.round(waterScore),
        consistency: Math.round(weightConsistency),
      },
    });
  }, [
    days,
    mealData.summary?.days,
    waterData.dailyGoalCups,
    waterData.summaryDays,
    waterData.cupSize,
    weightData.logs?.length
  ]);

  useEffect(() => {
    if (!mealsLoading && !waterLoading && !weightLoading) {
      calculateAdherence();
    }
  }, [calculateAdherence, mealsLoading, waterLoading, weightLoading]);

  return {
    adherence,
    loading: mealsLoading || waterLoading || weightLoading,
    error: mealsError,
  };
}