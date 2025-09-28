export const CAPABILITY_CODES = [
  'DIETA_EDIT',
  'DIETA_VIEW',
  'AGUA_LOG',
  'CONSULTA_AGENDAR',
  'CONSULTA_CANCELAR',
  'CHAT_NUTRI',
  'RELATORIO_DOWNLOAD',
  'PESO_LOG',
  'REFEICAO_LOG'
] as const;
export type CapabilityCode = typeof CAPABILITY_CODES[number];