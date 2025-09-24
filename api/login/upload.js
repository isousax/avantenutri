export default async function handler(req, res) {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({ error: "Missing key" });
    }

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);

    const r = await fetch(
      `https://dedicart-file-worker.dedicart.workers.dev/upload?key=${key}`,
      {
        method: "PUT",
        body: bodyBuffer,
        headers: {
          "Content-Type": req.headers.get("content-type") || "application/octet-stream",
          "Authorization": `Bearer ${process.env.WORKER_API_KEY}`,
        },
      }
    );

    const body = await r.json();
    
    return res.status(r.status).json(body);
  } catch (err) {
    console.error("Erro no proxy:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}