import { json } from "../_utils/security.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Method not allowed" });
  }
  try {
    const upstream = await fetch(
      "https://login-service.avantenutri.workers.dev/auth/entitlements",
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
    console.error("[auth/entitlements] proxy error", err);
    return json(res, 500, { error: "Internal Server Error" });
  }
}

function buildAuthHeaders(req) {
  const headers = { "Content-Type": "application/json" };
  if (req.headers.authorization)
    headers["Authorization"] = req.headers.authorization;
  return headers;
}
