import { methodGuard, json, validateEmail, validatePassword, rateLimit, extractIp } from '../../_utils/security';

export default async function handler(req, res) {
  if (!methodGuard(req, res, 'POST')) return;
  const ip = extractIp(req);
  if (!rateLimit(`register:${ip}`, 5, 300_000)) {
    return json(res, 429, { error: 'Too many registrations attempts' });
  }
  try {
    const { email, password, full_name } = req.body || {};
    if (!validateEmail(email) || !validatePassword(password)) {
      return json(res, 400, { error: 'Invalid registration payload' });
    }
    const upstream = await fetch('https://login-service.avantenutri.workers.dev/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: typeof full_name === 'string' ? full_name : undefined }),
    });
    let data = null;
    try { data = await upstream.json(); } catch { data = null; }
    return json(res, upstream.status, data ?? {});
  } catch (err) {
    console.error('Erro no proxy register:', err);
    return json(res, 500, { error: 'Internal Server Error' });
  }
}