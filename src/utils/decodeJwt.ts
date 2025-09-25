/**
 * Decodifica o payload de um JWT no browser (base64url) com validações básicas do header.
 * IMPORTANTE: NÃO valida a assinatura; isso deve ser feito no backend.
 * Retorna o payload e inclui o header em _header (campo não padronizado) apenas para inspeção.
 */
export function decodeJwt(
  token: string
): (Record<string, unknown> & { _header?: Record<string, unknown> }) | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const [headerB64u, payloadB64u] = parts;

    const base64UrlDecode = (segment: string) => {
      let b64 = segment.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "="; // padding
      try {
        return atob(b64);
      } catch {
        return "";
      }
    };

    const headerJson = base64UrlDecode(headerB64u);
    let header: Record<string, unknown> | undefined;
    if (headerJson) {
      try {
        header = JSON.parse(headerJson);
      } catch {
        header = undefined;
      }
    }

    if (header && typeof header === "object") {
      const alg = (header as Record<string, unknown>).alg;
      if (!alg) {
        console.warn("[decodeJwt] Header sem 'alg' — token possivelmente inválido");
      } else if (alg === "none") {
        console.error(
          "[decodeJwt] Algoritmo 'none' detectado. Rejeite tokens sem assinatura no backend!"
        );
      }
    }

    const payloadJson = base64UrlDecode(payloadB64u);
    if (!payloadJson) return null;
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    if (header) payload._header = header;
    return payload;
  } catch (err) {
    console.warn("[decodeJwt] failed", err);
    return null;
  }
}