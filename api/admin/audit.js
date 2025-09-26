import { json } from "../_utils/security.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Method not allowed" });
  }
  try {
    const {
      type = "password",
      page = "1",
      pageSize = "20",
      user_id = "",
    } = req.query || {};
    const qs = new URLSearchParams();
    qs.set("type", String(type));
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));
    if (user_id) qs.set("user_id", user_id);
    const upstream = await fetch(
      `https://login-service.avantenutri.workers.dev/admin/audit?${qs.toString()}`,
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
    console.error("[admin/audit] proxy error", err);
    return json(res, 500, { error: "Internal Server Error" });
  }
}

function buildAuthHeaders(req) {
  const headers = { "Content-Type": "application/json" };
  if (req.headers.authorization)
    headers["Authorization"] = req.headers.authorization;
  if (req.headers["x-api-key"]) headers["x-api-key"] = req.headers["x-api-key"];
  return headers;
}
