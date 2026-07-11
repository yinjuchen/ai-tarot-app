
export async function getGptAnswer(cardName) {
  try {
    const response = await fetch("/api/tarot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ cardName })
    })

    if (!response.ok) {
      console.error("API error", response.status)
      return "Failed to load message. Please try again later"
    }

    const data = await response.json()
    return data.message || "No response received"
  }
  catch(err) {
    console.error("oops", err)
    return "Failed to load message. Please try again later"
 }
}