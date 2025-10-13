// Utilitários de data para tratar strings 'YYYY-MM-DD' como datas locais

/**
 * Converte 'YYYY-MM-DD' em Date local (sem interpretar como UTC).
 */
export function parseYMDToLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * Formata uma instância Date para 'YYYY-MM-DD' usando o fuso LOCAL do usuário.
 */
export function formatYMDLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

/**
 * Faz o parse de uma string no formato SQL "YYYY-MM-DD HH:mm:ss" como horário LOCAL do usuário.
 * Falls back para "YYYY-MM-DD" como data local e, por fim, para new Date(input).
 */
export function parseSQLDateTimeToLocal(input: string | number | Date): Date {
  if (input instanceof Date) return input;
  if (typeof input === "number") return new Date(input);
  if (typeof input !== "string") return new Date(String(input));

  // "YYYY-MM-DD HH:mm:ss"
  const sqlMatch = input.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
  );
  if (sqlMatch) {
    const [, y, m, d, hh, mm, ss] = sqlMatch.map(Number) as unknown as [
      number,
      number,
      number,
      number,
      number,
      number,
      number
    ];
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0, 0);
  }

  // "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return parseYMDToLocalDate(input);
  }

  // Fallback: deixar o motor decidir (pode interpretar como UTC dependendo do formato)
  return new Date(input);
}

/**
 * Formata usando o fuso local do usuário uma string vinda do backend (SQL datetime ou date),
 * respeitando o locale informado.
 */
export function formatLocalDateTime(
  input: string | number | Date,
  locale: "pt" | "en",
  opts?: Intl.DateTimeFormatOptions
): string {
  const d = input instanceof Date ? input : parseSQLDateTimeToLocal(input);
  const fmt = new Intl.DateTimeFormat(
    locale === "pt" ? "pt-BR" : "en-US",
    opts || { day: "numeric", month: "short", year: "numeric" }
  );
  return fmt.format(d);
}

/**
 * Versão que assume que a string SQL "YYYY-MM-DD HH:mm:ss" está em UTC
 * e converte para horário local na formatação.
 */
export function parseSQLDateTimeAssumingUTC(input: string | number | Date): Date {
  if (input instanceof Date) return input;
  if (typeof input === "number") return new Date(input);
  if (typeof input !== "string") return new Date(String(input));

  const sqlMatch = input.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
  );
  if (sqlMatch) {
    const y = Number(sqlMatch[1]);
    const m = Number(sqlMatch[2]);
    const d = Number(sqlMatch[3]);
    const hh = Number(sqlMatch[4]);
    const mm = Number(sqlMatch[5]);
    const ss = Number(sqlMatch[6]);
    const ms = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0, 0);
    return new Date(ms);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    // Date-only: tratar como local (não há timezone), mantém compatibilidade
    return parseYMDToLocalDate(input);
  }

  return new Date(input);
}

export function formatLocalDateTimeFromUTC(
  input: string | number | Date,
  locale: "pt" | "en",
  opts?: Intl.DateTimeFormatOptions
): string {
  const d = input instanceof Date ? input : parseSQLDateTimeAssumingUTC(input);
  const fmt = new Intl.DateTimeFormat(
    locale === "pt" ? "pt-BR" : "en-US",
    opts || { day: "numeric", month: "short", year: "numeric" }
  );
  return fmt.format(d);
}
