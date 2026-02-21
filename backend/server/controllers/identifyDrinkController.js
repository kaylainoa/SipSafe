const fetch = require("node-fetch");

const SPOOFING_PROMPT = `You are a drink-safety assistant. Analyze this image of a drink (alcoholic beverage) for signs of tampering or spoofing.\n\nLook for:\n- Unusual cloudiness or sediment\n- Discoloration or color changes that seem off\n- Foaming or bubbling that appears abnormal\n- Opened, broken, or re-sealed containers/caps\n- Any visible residue, film, or particles\n- Signs the drink may have been left unattended and altered\n\nRespond in JSON format with exactly this structure (no other text):\n{\n  "safe": true or false,\n  "confidence": "high" | "medium" | "low",\n  "concerns": ["brief concern 1", "brief concern 2"] or [],\n  "summary": "One sentence summary for the user"\n}\n\nIf the image is unclear, not a drink, or you cannot assess: set safe to false, confidence to "low", and explain in summary.`;

async function analyzeDrinkForSpoofing(base64Image, mimeType = "image/jpeg") {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return {
      safe: false,
      confidence: "low",
      concerns: [
        "API key not configured. Add GEMINI_API_KEY to your .env at project root.",
      ],
      summary:
        "Unable to analyze — API key missing. Check your environment variables.",
    };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mimeType, data: base64Image } },
                { text: SPOOFING_PROMPT },
              ],
            },
          ],
        }),
      },
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini API ${res.status}: ${errBody.slice(0, 300)}`);
    }

    const json = await res.json();
    const blockReason = json?.promptFeedback?.blockReason;
    if (blockReason) {
      return {
        safe: false,
        confidence: "low",
        concerns: [`Content blocked: ${blockReason}`],
        summary:
          "Image could not be analyzed. Try a clearer photo of your drink.",
      };
    }

    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      return {
        safe: false,
        confidence: "low",
        concerns: ["No response from AI."],
        summary: "Could not analyze the image. Try again.",
      };
    }

    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    else {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}") + 1;
      if (start >= 0 && end > start) jsonStr = text.slice(start, end);
    }

    const parsed = JSON.parse(jsonStr);
    return {
      safe: Boolean(parsed.safe),
      confidence: parsed.confidence ?? "medium",
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      summary: String(parsed.summary ?? "Analysis complete."),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      safe: false,
      confidence: "low",
      concerns: [msg],
      summary: "Failed to analyze image. Check your connection and try again.",
    };
  }
}

exports.identifyDrinkController = async (req, res) => {
  const { base64Image, mimeType } = req.body;
  if (!base64Image) {
    return res
      .status(400)
      .json({ error: "Missing base64Image in request body." });
  }
  const result = await analyzeDrinkForSpoofing(base64Image, mimeType);
  res.json(result);
};
