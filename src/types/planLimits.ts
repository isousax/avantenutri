export const PLAN_LIMIT_KEYS = [
  'DIETA_REVISOES_MES',
  'CONSULTAS_INCLUIDAS_MES',
  'WATER_ML_DIA'
] as const;
export type PlanLimitKey = typeof PLAN_LIMIT_KEYS[number];