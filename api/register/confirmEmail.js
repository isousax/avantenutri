export default async function handler(req, res) {
  try {
    const body = req.body;

    if (!body) {
      return res.status(400).json({ error: "Missing body" });
    }

    const r = await fetch(
      "https://login-service.avantenutri.workers.dev/auth/confirm-verification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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