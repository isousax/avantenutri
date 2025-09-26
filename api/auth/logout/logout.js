import { methodGuard, json, validateRefreshToken } from '../../_utils/security';
import { meCacheInvalidateToken } from '../../_utils/meCache';

export default async function handler(req, res) {
  if (!methodGuard(req, res, 'POST')) return;
  try {
    const { refresh_token } = req.body || {};
    if (!validateRefreshToken(refresh_token)) {
      return json(res, 400, { error: 'Invalid refresh token' });
    }
    const upstream = await fetch('https://login-service.avantenutri.workers.dev/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    });
    let data = null;
    try { data = await upstream.json(); } catch { data = null; }
    // Invalida somente o token de acesso enviado (se presente) ao invés de limpar todo o cache
    try {
      const auth = req.headers.authorization || req.headers.Authorization;
      if (auth && /^Bearer\s+.+/i.test(auth)) {
        const accessToken = auth.split(/\s+/)[1];
        if (accessToken) meCacheInvalidateToken(accessToken);
      }
    } catch {}
    return json(res, upstream.status, data ?? {});
  } catch (err) {
    console.error('Erro no proxy logout:', err);
    return json(res, 500, { error: 'Internal Server Error' });
  }
}