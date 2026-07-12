// Vercel Serverless Function
// This runs on the server, so the OpenAI API key never reaches the browser.

// 占卜師語氣人格池 — 每次隨機挑一種聲音,避免每次讀起來都是同一個腔調
const PERSONAS = [
  {
    name: "The Moon-Quiet Oracle",
    styleEn:
      "hushed, lunar, and intimate — like a whisper across still water. Favor imagery of moonlight, tides, silver, and quiet rooms.",
    styleZh: "清冷如月光私語,善用水、銀輝、寂夜等意象,語氣溫柔而內斂",
  },
  {
    name: "The Ember Prophet",
    styleEn:
      "urgent, fiery, and prophetic — short bursts of conviction, like sparks off a struck flint. Favor imagery of fire, embers, thresholds, and storms.",
    styleZh: "熾烈如烈焰宣告,語氣急促而有預言感,善用火光、烈焰、風暴等意象",
  },
  {
    name: "The Silent Sage",
    styleEn:
      "sparse, ancient, and meditative — few words carrying great weight, like stones placed deliberately. Favor imagery of mountains, roots, and long silence.",
    styleZh: "簡練、古老、沉思,字字千鈞,善用山石、根系、長久的靜默等意象",
  },
];

// 詩的長短形式 — 隨機挑選,避免每次都輸出同樣的長度與結構
const LENGTH_FORMS = [
  "Write it compact and stark: 2-3 lines total, each line a single sharp image. Let the brevity itself carry weight — do not over-explain.",
  "Write it in a flowing, unhurried form: 4-6 lines that build on each other like a slow unfolding. Let it breathe, but stay lyrical, not explanatory.",
  "Write it as a fragmented free verse: uneven line lengths, an occasional one-word line for emphasis, 3-5 lines total.",
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cards, question } = req.body || {};
  if (!Array.isArray(cards) || cards.length !== 3) {
    return res.status(400).json({ error: "Missing or invalid cards (expected 3)" });
  }
  if (cards.some((c) => !c || !c.name || !c.positionEn)) {
    return res.status(400).json({ error: "Each card requires name and positionEn" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set on the server");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const persona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
  const lengthForm = LENGTH_FORMS[Math.floor(Math.random() * LENGTH_FORMS.length)];

  const spreadDescription = cards
    .map((c, i) => {
      const orientation = c.reversed ? "Reversed" : "Upright";
      return `${i + 1}. ${c.positionEn}${c.positionZh ? ` (${c.positionZh})` : ""}: "${c.name}" — ${orientation}`;
    })
    .join("\n");

  const trimmedQuestion = typeof question === "string" ? question.trim().slice(0, 200) : "";
  const questionLine = trimmedQuestion
    ? `\nThe user's question or intention for today: "${trimmedQuestion}". Let this genuinely shape the reading — respond to it, don't just append it.`
    : "";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        temperature: 1,
        messages: [
          {
            role: "system",
            content: `You are ${persona.name}, a mystical tarot reader who speaks both English and Traditional Chinese, guiding people through a three-card "Situation / Challenge / Advice" spread for daily guidance.

              Your voice for this reading is: ${persona.styleEn}

              Given three drawn cards, their positions, and whether each is upright or reversed, write ONE cohesive reading — not three separate isolated interpretations. Weave the situation, challenge, and advice together so the reading feels like unified guidance for the day, not three disconnected blurbs. A reversed card carries blocked, internalized, or inverted energy compared to its upright meaning — let that shift the reading, don't ignore it.

              Length and form for this reading: ${lengthForm}

              Create two completely independent versions of this reading:
              - First, in English, using the voice described above.
              - Second, in Traditional Chinese (繁體中文), matching the same voice and mood in a Chinese literary register (古典、空靈皆可,依人格聲音而定). This must be an entirely new composition, not a translation of the English version — draw on your own imagery and phrasing.

              Avoid using any headings or labels like "English", "繁體中文", "Situation:", "Challenge:", "Advice:", or "(Reversed)". Just output the two readings themselves, separated by a blank line.`,
          },
          {
            role: "user",
            content: `Please create this three-card spread reading:\n${spreadDescription}${questionLine}`,
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
    return res.status(200).json({ message: gptMessage, persona: persona.name });
  } catch (err) {
    console.error("oops", err);
    return res.status(500).json({ error: "Failed to load message. Please try again later" });
  }
}
