import { methodGuard, json, validateEmail, validatePassword, rateLimit, extractIp, jitter } from '../../_utils/security.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, 'POST')) return;
  const ip = extractIp(req);
  if (!rateLimit(`login:${ip}`, 10, 60_000)) {
    await jitter();
    return json(res, 429, { error: 'Too many attempts. Try again later.' });
  }
  try {
    const { email, password, remember } = req.body || {};
    if (!validateEmail(email) || !validatePassword(password)) {
      await jitter();
      return json(res, 400, { error: 'Invalid credentials payload' });
    }
    const payload = { email, password, remember: !!remember };
    const upstream = await fetch('https://login-service.avantenutri.workers.dev/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    let data = null;
    try { data = await upstream.json(); } catch { data = null; }
    return json(res, upstream.status, data ?? {});
  } catch (err) {
    console.error('Erro no proxy login:', err);
    return json(res, 500, { error: 'Internal Server Error' });
  }
}