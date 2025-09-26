// Utilitários de segurança e rate limiting simples (in-memory, best-effort)
// Em ambiente serverless pode não persistir entre cold starts, mas ajuda contra bursts.

const rateBuckets = new Map(); // key => { count, reset }

export function rateLimit(key, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  let b = rateBuckets.get(key);
  if (!b || b.reset < now) {
    b = { count: 0, reset: now + windowMs };
    rateBuckets.set(key, b);
  }
  b.count += 1;
  return b.count <= limit;
}

export function setSecurityHeaders(res) {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'DENY');
  } catch {}
}

export function json(res, status, body) {
  setSecurityHeaders(res);
  res.status(status).json(body);
}

export function methodGuard(req, res, method = 'POST') {
  if (req.method !== method) {
    res.setHeader('Allow', method);
    json(res, 405, { error: 'Method Not Allowed' });
    return false;
  }
  return true;
}

export function extractIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

export function validateEmail(email) {
  return typeof email === 'string' && /.+@.+\..+/.test(email) && email.length <= 150;
}

export function validatePassword(pwd) {
  return typeof pwd === 'string' && pwd.length >= 6 && pwd.length <= 256;
}

export function validateRefreshToken(t) {
  return typeof t === 'string' && t.length >= 20 && t.length <= 1000;
}

// Pequeno atraso aleatório para respostas sensíveis (mitiga análise de tempo)
export async function jitter(minMs = 120, maxMs = 320) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}