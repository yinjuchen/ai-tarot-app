// Vercel Serverless Function
// This runs on the server, so the OpenAI API key never reaches the browser.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cardName } = req.body || {};
  if (!cardName) {
    return res.status(400).json({ error: "Missing cardName" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set on the server");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 250,
        messages: [
          {
            role: "system",
            content: `You are a mystical tarot reader who speaks both English and Traditional Chinese.For each card reading, create two completely independent short poems:
              - First, a mystical and spiritual English poem(2- 3 lines) that stands on its own.
              - Second, a Traditional Chinese poem(2- 3 lines, written in 繁體中文, ancient and timeless style).This poem must be an entirely new work, not a translation or rewriting of the English poem.
              Use your own inspiration from ancient wisdom or spiritual imagery to create the Chinese poem.
              Avoid using any headings or labels like "English Poem" or "繁體中文詩句". Just output the two poems themselves, separated by a blank line.`,
          },
          {
            role: "user",
            content: `Please create these two poems for the card "${cardName}".`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error", response.status, errText);
      return res.status(502).json({ error: "Upstream OpenAI request failed" });
    }

    const data = await response.json();
    const gptMessage = data.choices?.[0]?.message?.content || "No response received";
    return res.status(200).json({ message: gptMessage });
  } catch (err) {
    console.error("oops", err);
    return res.status(500).json({ error: "Failed to load message. Please try again later" });
  }
}
