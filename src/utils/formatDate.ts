export function formatDateSafe(input: string | undefined | null, locale: "pt" | "en") {
  if (!input || typeof input !== "string" || !input.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return input ?? "";
  }

  const [year, month, day] = input.split("-");
  return locale === "pt" ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
}
