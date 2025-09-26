import { methodGuard, json, validateEmail, rateLimit, extractIp } from '../../_utils/security.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, 'POST')) return;
  const ip = extractIp(req);
  if (!rateLimit(`resend:${ip}`, 5, 300_000)) {
    return json(res, 429, { error: 'Too many resend attempts' });
  }
  try {
    const { email } = req.body || {};
    if (!validateEmail(email)) {
      return json(res, 400, { error: 'Invalid email' });
    }
    const upstream = await fetch('https://login-service.avantenutri.workers.dev/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    let data = null;
    try { data = await upstream.json(); } catch { data = null; }
    return json(res, upstream.status, data ?? {});
  } catch (err) {
    console.error('Erro no proxy resend-verification:', err);
    return json(res, 500, { error: 'Internal Server Error' });
  }
}