import { methodGuard, json } from "../../_utils/security.js";

export default async function handler(req, res) {
  if (!["GET"].includes(req.method)) return methodGuard(req, res, "GET");
  try {
    const {
      page = "1",
      pageSize = "20",
      q = "",
      user_id = "",
    } = req.query || {};
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));
    if (q) qs.set("q", q);
    if (user_id) qs.set("user_id", user_id);
    const upstream = await fetch(
      `https://login-service.avantenutri.workers.dev/admin/users?${qs.toString()}`,
      { headers: buildAuthHeaders(req) }
    );
    let data = null;
    try {
      data = await upstream.json();
    } catch {
      data = null;
    }
    return json(res, upstream.status, data ?? {});
  } catch (err) {
    console.error("[admin/users] proxy error", err);
    return json(res, 500, { error: "Internal Server Error" });
  }
}

function buildAuthHeaders(req) {
  const headers = { "Content-Type": "application/json" };
  if (req.headers.authorization)
    headers["Authorization"] = req.headers.authorization;
  return headers;
}
