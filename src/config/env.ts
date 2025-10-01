// Acesso tipado às variáveis de ambiente (Vite expõe import.meta.env)
// Defina valores em .env.local usando prefixo VITE_

interface AppEnv {
  SITE_DNS: string | undefined;
  JWT_JWKS_URL: string | undefined;
  JWT_EXPECTED_ISSUER: string | undefined;
  JWT_EXPECTED_AUDIENCE: string | undefined;
  ME_CACHE_TTL_MS: number;
  APP_VERSION: string | undefined;
  API_AUTH_BASE: string | undefined;
}

function toNumber(v: unknown, fallback: number) {
  const n = typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

/**
 * sanitizeBaseUrl
 * Corrige erros comuns de configuração em VITE_API_BASE:
 *  - Falta de ':' depois de http/https (ex: "https//dominio.com")
 *  - Duplicação de barras finais
 *  - Espaços em branco
 * Mantém somente um esquema válido e remove trailing slashes.
 */
function sanitizeBaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  let v = raw.trim();
  // Corrige esquemas sem ':' (https// / http//)
  if (v.startsWith("https//")) v = "https://" + v.slice("https//".length);
  else if (v.startsWith("http//")) v = "http://" + v.slice("http//".length);

  // Se veio algo como 'https:////' normaliza para 'https://'
  v = v.replace(/^(https?:)\/+/, (_match: string, p1: string) => p1 + "//");
  // Remove barras finais extras
  v = v.replace(/\/+$/, "");
  // Validação básica
  if (!/^https?:\/\//i.test(v)) {
    console.warn("[ENV] API_AUTH_BASE inválida após sanitização:", v);
    return v; // devolve mesmo assim para debug
  }
  return v;
}

const RAW_API_BASE = import.meta.env.VITE_API_BASE as string | undefined;
const SANITIZED_API_BASE = sanitizeBaseUrl(RAW_API_BASE);
if (RAW_API_BASE && SANITIZED_API_BASE && RAW_API_BASE !== SANITIZED_API_BASE) {
  // Log único para facilitar diagnóstico em produção (não spam)
  // eslint-disable-next-line no-console
  console.warn(
    "[ENV] Corrigida VITE_API_BASE malformada:",
    { original: RAW_API_BASE, sanitized: SANITIZED_API_BASE }
  );
}

export const ENV: AppEnv = {
  SITE_DNS: import.meta.env.VITE_SITE_DNS,
  JWT_JWKS_URL: import.meta.env.VITE_JWT_JWKS_URL,
  JWT_EXPECTED_ISSUER: import.meta.env.VITE_JWT_EXPECTED_ISSUER,
  JWT_EXPECTED_AUDIENCE: import.meta.env.VITE_JWT_EXPECTED_AUDIENCE,
  ME_CACHE_TTL_MS: toNumber(import.meta.env.VITE_ME_CACHE_TTL_MS, 60000),
  APP_VERSION: import.meta.env.VITE_APP_VERSION,
  API_AUTH_BASE: SANITIZED_API_BASE
};
