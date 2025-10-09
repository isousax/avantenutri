// Utilitários de data para tratar strings 'YYYY-MM-DD' como datas locais

/**
 * Converte 'YYYY-MM-DD' em Date local (sem interpretar como UTC).
 */
export function parseYMDToLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * Formata dia da semana curto em pt-BR a partir de 'YYYY-MM-DD'.
 */
export function formatWeekdayShortPtBR(ymd: string): string {
  return parseYMDToLocalDate(ymd)
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .slice(0, 3);
}

/**
 * Formata data tipo '9 de out. de 2025' a partir de 'YYYY-MM-DD'.
 */
export function formatDateLongPtBR(ymd: string): string {
  return parseYMDToLocalDate(ymd).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
