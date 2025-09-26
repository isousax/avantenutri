import { methodGuard, json, rateLimit, extractIp, validatePassword, jitter } from '../../_utils/security';

// Política de senha backend (reforçada aqui): 8+ chars, minúscula, maiúscula, número e símbolo.
const STRONG_PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

export default async function handler(req, res) {
  if (!methodGuard(req, res, 'POST')) return;
  const ip = extractIp(req);
  if (!rateLimit(`pwdreset:${ip}`, 10, 60_000)) {
    await jitter();
    return json(res, 429, { error: 'Too many reset attempts. Try again later.' });
  }
  try {
    const { token, new_password } = req.body || {};
    if (typeof token !== 'string' || token.length < 16 || token.length > 600) {
      await jitter();
      return json(res, 400, { error: 'Invalid token' });
    }
    if (typeof new_password !== 'string' || !STRONG_PWD_REGEX.test(new_password)) {
      await jitter();
      return json(res, 400, { error: 'Password does not meet complexity requirements' });
    }

    const upstream = await fetch('https://login-service.avantenutri.workers.dev/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password })
    });
    let data = null;
    try { data = await upstream.json(); } catch { data = null; }
    return json(res, upstream.status, data ?? {});
  } catch (err) {
    console.error('Erro no proxy reset-password:', err);
    return json(res, 500, { error: 'Internal Server Error' });
  }
}
