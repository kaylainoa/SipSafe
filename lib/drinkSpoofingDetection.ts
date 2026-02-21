/**
 * SipSafe — drinkSpoofingDetection.ts
 *
 * Uses Gemini multimodal vision (REST API) to analyze a drink photo for signs of
 * tampering/spoofing. Uses fetch directly for React Native compatibility.
 */

const SPOOFING_PROMPT = `You are a drink-safety assistant. Analyze this image of a drink (alcoholic beverage) for signs of tampering or spoofing.

Look for:
- Unusual cloudiness or sediment
- Discoloration or color changes that seem off
- Foaming or bubbling that appears abnormal
- Opened, broken, or re-sealed containers/caps
- Any visible residue, film, or particles
- Signs the drink may have been left unattended and altered

Respond in JSON format with exactly this structure (no other text):
{
  "safe": true or false,
  "confidence": "high" | "medium" | "low",
  "concerns": ["brief concern 1", "brief concern 2"] or [],
  "summary": "One sentence summary for the user"
}

If the image is unclear, not a drink, or you cannot assess: set safe to false, confidence to "low", and explain in summary.`;

export interface SpoofingResult {
  safe: boolean;
  confidence: "high" | "medium" | "low";
  concerns: string[];
  summary: string;
}

export async function analyzeDrinkForSpoofing(
  base64Image: string,
  mimeType: "image/jpeg" | "image/png" = "image/jpeg"
): Promise<SpoofingResult> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return {
      safe: false,
      confidence: "low",
      concerns: ["API key not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env at project root."],
      summary: "Unable to analyze — API key missing. Check your environment variables.",
    };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Image } },
              { text: SPOOFING_PROMPT },
            ],
          }],
        }),
      }
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
        summary: "Image could not be analyzed. Try a clearer photo of your drink.",
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

    const parsed = JSON.parse(jsonStr) as SpoofingResult;
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
