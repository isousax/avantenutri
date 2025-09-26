
// Utilitário de verificação de assinatura JWT usando 'jose'
// NOTA: Em ambiente serverless, carregue a chave publicamente segura via variável de ambiente.
// Suporta JWKS remoto (caching simples) ou chave pública PEM diretamente.

import { jwtVerify, createRemoteJWKSet, importSPKI } from 'jose';

let jwksCache = null; // RemoteJWKSet instance
let lastJwksUrl = null;

/**
 * Obtém RemoteJWKSet cacheado.
 */
async function getJwks(jwksUrl) {
  if (!jwksUrl) throw new Error('JWKS url não configurada');
  if (jwksCache && lastJwksUrl === jwksUrl) return jwksCache;
  const url = new URL(jwksUrl);
  jwksCache = createRemoteJWKSet(url);
  lastJwksUrl = jwksUrl;
  return jwksCache;
}

/**
 * Verifica assinatura e retorna payload se válido.
 * options: { issuer?, audience?, jwksUrl?, algorithms? }
 */
export async function verifyJwt(token, options = {}) {
  const {
    issuer,
    audience,
    jwksUrl = process.env.JWT_JWKS_URL,
    algorithms = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'],
    publicKeyPem = process.env.JWT_PUBLIC_KEY_PEM,
  } = options;
  if (!token) throw new Error('Token vazio');

  let keyResolver;
  if (publicKeyPem) {
    // Importa chave PEM diretamente (SPKI)
    keyResolver = await importSPKI(publicKeyPem, algorithms[0]);
  } else {
    keyResolver = await getJwks(jwksUrl);
  }

  const verifyOpts = { algorithms };
  if (issuer) verifyOpts.issuer = issuer;
  if (audience) verifyOpts.audience = audience;

  const { payload, protectedHeader } = await jwtVerify(token, keyResolver, verifyOpts);
  // Defesa extra: algoritmo do header precisa estar na allowlist
  if (!algorithms.includes(protectedHeader.alg)) {
    throw new Error('Algoritmo não permitido');
  }
  return { payload, header: protectedHeader };
}

/** Decodifica partes sem validar assinatura (uso excepcional) */
export function unsafeDecode(token) {
  const [h, p] = token.split('.');
  if (!p) return null;
  const decode = (seg) => {
    let b64 = seg.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  };
  return { header: h ? decode(h) : null, payload: decode(p) };
}