import { methodGuard, json, validateRefreshToken } from "../_utils/security.js";
import { meCacheClearAll } from "../_utils/meCache";

export default async function handler(req, res) {
  if (!methodGuard(req, res, "POST")) return;
  try {
    const { refresh_token } = req.body || {};
    if (!validateRefreshToken(refresh_token)) {
      return json(res, 400, { error: "Invalid refresh token" });
    }
    const upstream = await fetch(
      "https://login-service.avantenutri.workers.dev/auth/logout",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token }),
      }
    );
    let data = null;
    try {
      data = await upstream.json();
    } catch {
      data = null;
    }
    // Limpa cache de /me para minimizar risco de dados desatualizados pós logout
    try {
      meCacheClearAll();
    } catch {}
    return json(res, upstream.status, data ?? {});
  } catch (err) {
    console.error("Erro no proxy logout:", err);
    return json(res, 500, { error: "Internal Server Error" });
  }
}
