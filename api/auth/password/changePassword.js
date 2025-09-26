import { json, jitter } from '../../_utils/security';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method Not Allowed' });
  }
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || !/^Bearer\s+.+/i.test(auth)) {
    await jitter();
    return json(res, 401, { error: 'Missing bearer token' });
  }
  let body;
  try { body = req.body || {}; } catch { body = {}; }
  const { current_password, new_password } = body;
  if (!current_password || !new_password) {
    return json(res, 400, { error: 'current_password and new_password required' });
  }
  try {
    const upstream = await fetch('https://login-service.avantenutri.workers.dev/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
      },
      body: JSON.stringify({ current_password, new_password })
    });
    const data = await upstream.json().catch(() => ({}));
    res.status(upstream.status);
    return json(res, upstream.status, data);
  } catch (err) {
    console.error('Erro proxy change-password:', err);
    return json(res, 502, { error: 'Upstream error' });
  }
}
