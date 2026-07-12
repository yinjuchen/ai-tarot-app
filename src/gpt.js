
// 三張牌排陣：傳送三張牌 + 位置意義 + 正逆位 + 使用者提問,取得整合敘事解讀
// 回傳 { message, persona }，persona 是這次隨機挑到的占卜師語氣人格名稱
export async function getGptSpreadAnswer(spreadCards, question = "") {
  try {
    const response = await fetch("/api/tarot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cards: spreadCards.map((c) => ({
          name: c.name,
          positionEn: c.positionEn,
          positionZh: c.positionZh,
          reversed: !!c.reversed,
        })),
        question,
      })
    })

    if (!response.ok) {
      console.error("API error", response.status)
      return { message: "Failed to load message. Please try again later", persona: "" }
    }

    const data = await response.json()
    return {
      message: data.message || "No response received",
      persona: data.persona || "",
    }
  }
  catch(err) {
    console.error("oops", err)
    return { message: "Failed to load message. Please try again later", persona: "" }
 }
}