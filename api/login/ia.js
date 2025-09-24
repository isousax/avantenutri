export default async function handler(req, res) {
  try {
      const body = req.body;

    const r = await fetch(
      "https://dedicart-file-worker.dedicart.workers.dev/ai",
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
