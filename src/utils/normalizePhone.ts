export function normalizePhone(input: string) {
  if (!input) return input;
  const digits = input.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 15 && digits.startsWith("55")) {
    return "+" + digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return "+55" + digits;
  }
  if (input.trim().startsWith("+")) return "+" + digits;
  return digits;
}