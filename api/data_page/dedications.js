export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  try {
    const r = await fetch(
      `https://dedicart-data-page-worker.dedicart.workers.dev/users/${encodeURIComponent(
        email
      )}/dedications`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WORKER_API_KEY}`,
        },
      }
    );

    const body = await r.json();

    if (r.headers.get("cache-control")) res.setHeader("Cache-Control", r.headers.get("cache-control"));

    return res.status(r.status).json(body);
  } catch (err) {
    console.error("Erro no proxy:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
