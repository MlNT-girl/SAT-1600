export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(501).json({
      error: "AI Tutor isn't configured yet — add an ANTHROPIC_API_KEY environment variable in your hosting dashboard.",
    });
  }

  const { topic, message } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing message." });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `You are a patient, precise SAT tutor for a student prepping toward a 1600. Current focus topic: ${topic || "general SAT prep"}. Never invent official SAT rules or claim something is an official College Board question when it isn't — if unsure, say so and recommend checking official College Board / Khan Academy resources. Keep answers concise, encouraging but honest, and concrete. Student asks: ${message}`,
          },
        ],
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data?.error?.message || "Anthropic API request failed." });
    }
    const text = (data.content || []).map((b) => b.text || "").join("\n").trim();
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: "Tutor request failed." });
  }
}
