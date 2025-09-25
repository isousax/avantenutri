import { methodGuard, json, rateLimit, extractIp } from '../../_utils/security';

export default async function handler(req, res) {
  if (!methodGuard(req, res, 'POST')) return;
  const ip = extractIp(req);
  if (!rateLimit(`confirm:${ip}`, 10, 300_000)) {
    return json(res, 429, { error: 'Too many confirmation attempts' });
  }
  try {
    const { token } = req.body || {};
    if (typeof token !== 'string' || token.length < 10 || token.length > 500) {
      return json(res, 400, { error: 'Invalid verification token' });
    }
    const upstream = await fetch('https://login-service.avantenutri.workers.dev/auth/confirm-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    let data = null;
    try { data = await upstream.json(); } catch { data = null; }
    return json(res, upstream.status, data ?? {});
  } catch (err) {
    console.error('Erro no proxy confirm-verification:', err);
    return json(res, 500, { error: 'Internal Server Error' });
  }
}