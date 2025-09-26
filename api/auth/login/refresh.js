import { methodGuard, json, validateRefreshToken, rateLimit, extractIp } from '../../_utils/security.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, 'POST')) return;
  const ip = extractIp(req);
  if (!rateLimit(`refresh:${ip}`, 30, 60_000)) {
    return json(res, 429, { error: 'Too many refresh attempts' });
  }
  try {
    const { refresh_token } = req.body || {};
    if (!validateRefreshToken(refresh_token)) {
      return json(res, 400, { error: 'Invalid refresh token' });
    }
    const upstream = await fetch('https://login-service.avantenutri.workers.dev/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    });
    let data = null;
    try { data = await upstream.json(); } catch { data = null; }
    return json(res, upstream.status, data ?? {});
  } catch (err) {
    console.error('Erro no proxy refresh:', err);
    return json(res, 500, { error: 'Internal Server Error' });
  }
}