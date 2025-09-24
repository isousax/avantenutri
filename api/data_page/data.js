export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Id, X-Template-Id, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const rawHeaderId = req.headers["x-id"] || req.headers["id"];
    const rawHeaderTemplate =
      req.headers["x-template-id"] || req.headers["template_id"];

    const headerValToString = (v) =>
      Array.isArray(v) ? (v.length > 0 ? v[0] : undefined) : v;

    const id = headerValToString(rawHeaderId) || (req.query && req.query.id);
    const templateId =
      headerValToString(rawHeaderTemplate) ||
      (req.query && req.query.template_id);

    if (!id) {
      return res.status(400).json({ error: "Missing id" });
    }

    const normalized = (() => {
      try {
        return decodeURIComponent(String(id)).trim();
      } catch {
        return String(id).trim();
      }
    })();
    if (!/^([A-Z]+)-([A-Za-z0-9]+)$/.test(normalized)) {
      return res.status(400).json({ error: "Invalid id format" });
    }

    const upstream = new URL(
      "https://dedicart-data-page-worker.dedicart.workers.dev/data/consult"
    );
    upstream.searchParams.set("id", normalized);
    if (templateId)
      upstream.searchParams.set("template_id", String(templateId));

    const r = await fetch(upstream.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WORKER_API_KEY || ""}`,
      },
    });

    const cacheControl = r.headers.get("cache-control");
    if (cacheControl) res.setHeader("Cache-Control", cacheControl);

    const contentType = r.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await r.json()
      : await r.text();

    res.status(r.status);
    if (contentType.includes("application/json")) {
      res.setHeader("Content-Type", "application/json");
      return res.json(body);
    } else {
      if (contentType) res.setHeader("Content-Type", contentType);
      return res.send(body);
    }
  } catch (err) {
    console.error("Erro no proxy:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
