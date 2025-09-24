export default async function handler(req, res) {
  try {
    const body = req.body;

    if (!body) {
      return res.status(400).json({ error: "Missing body" });
    }

    const r = await fetch(
      "https://dedicart-mp-worker.dedicart.workers.dev/preview/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WORKER_API_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    console.error("Erro no proxy:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
