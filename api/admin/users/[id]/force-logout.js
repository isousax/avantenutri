import { json, methodGuard } from "../../../_utils/security.js";

export default async function handler(req, res) {
  if (!methodGuard(req, res, "POST")) return;
  const { id } = req.query || {};
  try {
    if (!id) return json(res, 400, { error: "id required" });
    const upstream = await fetch(
      `https://login-service.avantenutri.workers.dev/admin/users/${id}/force-logout`,
      {
        method: "POST",
        headers: buildAuthHeaders(req),
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
    console.error("[admin/users/:id/force-logout] proxy error", err);
    return json(res, 500, { error: "Internal Server Error" });
  }
}

function buildAuthHeaders(req) {
  const headers = { "Content-Type": "application/json" };
  if (req.headers.authorization)
    headers["Authorization"] = req.headers.authorization;
  return headers;
}
