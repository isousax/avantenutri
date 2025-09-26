import { methodGuard, json, validateEmail, rateLimit, extractIp, jitter } from '../../_utils/security';

// Proxy para solicitar envio de link de redefinição de senha
// Mantém respostas genéricas para evitar enumeração de usuários.
export default async function handler(req, res) {
  if (!methodGuard(req, res, 'POST')) return;
  const ip = extractIp(req);
  // Limita bursts de requisições de reset por IP
  if (!rateLimit(`pwdreq:${ip}`, 5, 60_000)) {
    await jitter();
    return json(res, 429, { error: 'Too many password reset attempts. Try later.' });
  }
  try {
    const { email } = req.body || {};
    if (!validateEmail(email)) {
      await jitter();
      return json(res, 200, { ok: true });
    }

    const upstream = await fetch('https://login-service.avantenutri.workers.dev/auth/request-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    let data = null;
    try { data = await upstream.json(); } catch { data = null; }

    // Upstream sempre tende a devolver { ok: true } independente; propagamos status e corpo.
    return json(res, upstream.status, data ?? { ok: true });
  } catch (err) {
    console.error('Erro no proxy request-reset:', err);
    // Retornamos sucesso genérico para não revelar estado interno
    return json(res, 200, { ok: true });
  }
}
