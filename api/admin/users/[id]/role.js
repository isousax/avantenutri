import { json, methodGuard } from "../../../_utils/security.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, "PATCH")) return;
  const { id } = req.query || {};
  try {
    const { new_role, reason } = req.body || {};
    if (!id || !new_role)
      return json(res, 400, { error: "id and new_role required" });
    const upstream = await fetch(
      `https://login-service.avantenutri.workers.dev/admin/users/${id}/role`,
      {
        method: "PATCH",
        headers: buildAuthHeaders(req),
        body: JSON.stringify({ new_role, reason }),
      }
    );
    let data = null;
    try {
      data = await upstream.json();
    } catch {
      data = null;
    }
    return json(res, upstream.status, data ?? {});
  } catch (err) {
    console.error("[admin/users/:id/role] proxy error", err);
    return json(res, 500, { error: "Internal Server Error" });
  }
}

function buildAuthHeaders(req) {
  const headers = { "Content-Type": "application/json" };
  if (req.headers.authorization)
    headers["Authorization"] = req.headers.authorization;
  return headers;
}
