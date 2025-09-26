// Endpoint experimental /api/auth/me
// Tenta validar token junto ao serviço remoto. Caso endpoint remoto não exista, retorna 501.
import { json, setSecurityHeaders } from '../../_utils/security.js';
import { verifyJwt, unsafeDecode } from '../../_utils/jwt.js';
import { meCacheGet, meCacheSet } from '../../_utils/meCache.js';

const DEFAULT_TTL_MS = Number(process.env.ME_CACHE_TTL_MS || 60000);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Method Not Allowed' });
  }
  try {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth || !/^Bearer\s+.+/i.test(auth)) {
      return json(res, 401, { error: 'Missing bearer token' });
    }
    const token = auth.split(/\s+/)[1];

    // Primeira etapa: verifica cache
  const cached = meCacheGet(token);
    if (cached) {
      res.setHeader('X-Me-Cache', 'HIT');
      return json(res, 200, cached);
    }

    // Segundo: tentativa de verificação local de assinatura via JWKS/Pem
  // Suporte a prefixo VITE_ para quando variáveis forem expostas ao build.
  const jwksUrl = process.env.JWT_JWKS_URL || process.env.VITE_JWT_JWKS_URL; // configure no ambiente (ex: Vercel)
  const publicKeyPem = process.env.JWT_PUBLIC_KEY_PEM; // alternativa a JWKS (NÃO expor ao client)
  const issuer = process.env.JWT_EXPECTED_ISSUER || process.env.VITE_JWT_EXPECTED_ISSUER; // opcional
  const audience = process.env.JWT_EXPECTED_AUDIENCE || process.env.VITE_JWT_EXPECTED_AUDIENCE; // opcional
    if (jwksUrl || publicKeyPem) {
      try {
        const { payload, header } = await verifyJwt(token, { jwksUrl, publicKeyPem, issuer, audience });
        // Normaliza retorno
        const responseData = {
          id: payload.sub || payload.user_id || payload.id,
          email: payload.email,
          role: payload.role,
          full_name: payload.full_name || payload.name,
          iat: payload.iat,
          exp: payload.exp,
          iss: payload.iss,
          aud: payload.aud,
          alg: header.alg,
          kid: header.kid,
          validationSource: publicKeyPem ? 'local-pem' : 'local-jwks'
        };
  meCacheSet(token, responseData, DEFAULT_TTL_MS);
        res.setHeader('X-Me-Cache', 'MISS');
        return json(res, 200, responseData);
      } catch (err) {
        // Se falhou verificação local, prossegue para upstream para confirmar (pode ter token de outro issuer)
        // Mas se o erro for de assinatura especificamente, podemos retornar 401 direto.
        if (String(err?.message || '').toLowerCase().includes('signature')) {
          return json(res, 401, { error: 'Invalid signature' });
        }
        // Continua para upstream
      }
    }

    // Fallback: proxy para upstream /auth/me (validação remota) – mantém comportamento original
  const upstreamUrl = 'https://login-service.avantenutri.workers.dev/auth/me';
    let upstreamResp;
    try {
      // Upstream worker espera POST (não GET). Mantemos GET somente local, mas fazemos POST para upstream.
      upstreamResp = await fetch(upstreamUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Como fallback extra, decodificação não confiável (NÃO substitui assinatura!)
      const dec = unsafeDecode(token);
      if (dec?.payload) {
        const fallbackData = { ...dec.payload, _warning: 'Upstream unavailable; signature NOT verified' };
        // Cache menor (10s) para evitar tempestade de requisições durante outage
  meCacheSet(token, fallbackData, 10000);
        res.setHeader('X-Me-Cache', 'MISS');
        return json(res, 200, fallbackData);
      }
      return json(res, 502, { error: 'Upstream connection failed' });
    }
    if (upstreamResp.status === 404) {
      return json(res, 501, { error: 'Upstream /auth/me not implemented' });
    }
    let data = null;
    try { data = await upstreamResp.json(); } catch { data = null; }
    if (upstreamResp.ok && data) {
      // TTL menor para resultado sem verificação local (30s)
  meCacheSet(token, data, 30000);
    }
    res.setHeader('X-Me-Cache', 'MISS');
    return json(res, upstreamResp.status, data ?? {});
  } catch (err) {
    console.error('Erro no proxy me:', err);
    return json(res, 500, { error: 'Internal Server Error' });
  }
}