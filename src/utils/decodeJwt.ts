/** Decodifica o payload de um JWT no browser (base64url) */
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    // base64url -> base64
    let b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    // pad
    while (b64.length % 4) b64 += "=";
    const json = atob(b64);
    return JSON.parse(json);
  } catch (err) {
    console.warn("[decodeJwt] failed", err);
    return null;
  }
}