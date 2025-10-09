import { json } from '../_utils/security.js';
import { verifyJwt, unsafeDecode } from '../_utils/jwt.js';
import { meCacheGet, meCacheSet } from '../_utils/meCache.js';

const DEFAULT_TTL_MS = Number(process.env.ME_CACHE_TTL_MS || 60000);

// Campos permitidos na resposta final (contrato estável com o front)
const ALLOWED_FIELDS = [
  'id',
  'email',
  'role',
  'full_name',
  'display_name',
  'phone',
  'birth_date',
  'photo_url',
];

function pickAllowed(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  for (const k of ALLOWED_FIELDS) if (k in obj) out[k] = obj[k];
  return out;
}

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
    const jwksUrl = process.env.JWT_JWKS_URL; // configure no ambiente (ex: Vercel)
    const publicKeyPem = process.env.JWT_PUBLIC_KEY_PEM; // alternativa a JWKS
    const issuer = process.env.JWT_EXPECTED_ISSUER; // opcional
    const audience = process.env.JWT_EXPECTED_AUDIENCE; // opcional
    // verifiedLocal guarda APENAS o subconjunto whitelisted, evitando vazar claims do JWT
    let verifiedLocal = null;
    if (jwksUrl || publicKeyPem) {
      try {
        const { payload } = await verifyJwt(token, { jwksUrl, publicKeyPem, issuer, audience });
        // Extrai apenas campos do contrato; nada de exp/iss/aud/alg/kid
        verifiedLocal = pickAllowed({
          id: payload.sub || payload.user_id || payload.id,
          email: payload.email,
          role: payload.role,
          full_name: payload.full_name || payload.name,
          phone: payload.phone,
          birth_date: payload.birth_date,
          // display_name e photo_url não vêm do token; permanecem undefined
        });
        // não retornamos ainda; vamos buscar upstream para enriquecer
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
      upstreamResp = await fetch(upstreamUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Como fallback extra, decodificação não confiável (NÃO substitui assinatura!)
      const dec = unsafeDecode(token);
      if (dec?.payload) {
        // Aplica whitelist para não vazar claims
        const fallbackData = pickAllowed({
          id: dec.payload.sub || dec.payload.user_id || dec.payload.id,
          email: dec.payload.email,
          role: dec.payload.role,
          full_name: dec.payload.full_name || dec.payload.name,
          phone: dec.payload.phone,
          birth_date: dec.payload.birth_date,
        });
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

    // Para 401/403 (ex.: email não verificado ou token inválido), não mascarar com fallback local
    if (upstreamResp.status === 401 || upstreamResp.status === 403) {
      res.setHeader('X-Me-Cache', 'MISS');
      return json(res, upstreamResp.status, data ?? { error: 'Unauthorized' });
    }

    if (upstreamResp.ok && data) {
      // Normaliza payload do upstream: alguns handlers retornam { user: { ... } }
      const upstreamData = (data && typeof data === 'object' && data.user && typeof data.user === 'object') ? data.user : data;
      const upstreamNorm = pickAllowed(upstreamData);
      // Se tivemos verificação local (whitelisted), enriquecemos com upstream (upstream tem prioridade)
      const merged = verifiedLocal ? { ...verifiedLocal, ...upstreamNorm } : upstreamNorm;
      meCacheSet(token, merged, 30000);
      res.setHeader('X-Me-Cache', 'MISS');
      return json(res, 200, merged);
    }

    // Se upstream falhou (ex.: 5xx) mas temos dados verificados localmente, devolve-os como fallback degradado
    if (verifiedLocal) {
      meCacheSet(token, verifiedLocal, DEFAULT_TTL_MS);
      res.setHeader('X-Me-Cache', 'MISS');
      return json(res, 200, verifiedLocal);
    }

    res.setHeader('X-Me-Cache', 'MISS');
    return json(res, upstreamResp.status, data ?? {});
  } catch (err) {
    console.error('Erro no proxy me:', err);
    return json(res, 500, { error: 'Internal Server Error' });
  }
}