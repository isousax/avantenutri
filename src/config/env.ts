// Acesso tipado às variáveis de ambiente (Vite expõe import.meta.env)
// Defina valores em .env.local usando prefixo VITE_

interface AppEnv {
  SITE_DNS: string | undefined;
  JWT_JWKS_URL: string | undefined;
  JWT_EXPECTED_ISSUER: string | undefined;
  JWT_EXPECTED_AUDIENCE: string | undefined;
  ME_CACHE_TTL_MS: number;
  APP_VERSION: string | undefined;
}

function toNumber(v: unknown, fallback: number) {
  const n = typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export const ENV: AppEnv = {
  SITE_DNS: import.meta.env.VITE_SITE_DNS,
  JWT_JWKS_URL: import.meta.env.VITE_JWT_JWKS_URL,
  JWT_EXPECTED_ISSUER: import.meta.env.VITE_JWT_EXPECTED_ISSUER,
  JWT_EXPECTED_AUDIENCE: import.meta.env.VITE_JWT_EXPECTED_AUDIENCE,
  ME_CACHE_TTL_MS: toNumber(import.meta.env.VITE_ME_CACHE_TTL_MS, 60000),
  APP_VERSION: import.meta.env.VITE_APP_VERSION,
};
