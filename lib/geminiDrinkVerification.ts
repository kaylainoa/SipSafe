type SupportedMimeType = "image/jpeg" | "image/png" | "image/webp";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
let cachedModel: string | null = null;

export interface DrinkVerificationResult {
  allowed: boolean;
  matchedDrinkType: string;
  isExpectedDrinkMatch: boolean;
  spoofingLikely: boolean;
  druggingLikely: boolean;
  summary: string;
  concerns: string[];
  voiceMessage: string;
}

interface GeminiRawResponse {
  match: boolean;
  matchedDrinkType: string;
  spoofingLikely: boolean;
  druggingLikely: boolean;
  summary: string;
  concerns: string[];
  voiceMessage: string;
}

function sanitizeModelJson(text: string): string {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

function toSafeString(input: unknown, fallback = ""): string {
  return typeof input === "string" ? input.trim() : fallback;
}

function toSafeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

async function resolveGeminiModel(apiKey: string): Promise<string> {
  if (cachedModel) return cachedModel;

  const explicit = process.env.EXPO_PUBLIC_GEMINI_MODEL?.trim();
  const candidateNames = [
    explicit,
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
  ].filter((name): name is string => Boolean(name));

  // Try likely models first to avoid a listModels call on healthy configs.
  for (const modelName of candidateNames) {
    const probe = await fetch(
      `${GEMINI_API_BASE}/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "ping" }] }],
          generationConfig: { maxOutputTokens: 1, temperature: 0 },
        }),
      }
    );
    if (probe.ok) {
      cachedModel = modelName;
      return modelName;
    }
  }

  const listResp = await fetch(`${GEMINI_API_BASE}/models?key=${encodeURIComponent(apiKey)}`);
  if (!listResp.ok) {
    const err = await listResp.text();
    throw new Error(`Gemini model discovery failed: ${listResp.status} ${err}`);
  }

  const listData = await listResp.json();
  const fromList: string | undefined = listData?.models
    ?.find((m: { name?: string; supportedGenerationMethods?: string[] }) =>
      Array.isArray(m?.supportedGenerationMethods) &&
      m.supportedGenerationMethods.includes("generateContent")
    )
    ?.name;

  if (!fromList) {
    throw new Error("No Gemini model with generateContent support was found for this API key.");
  }

  cachedModel = fromList.replace(/^models\//, "");
  return cachedModel;
}

export async function verifyDrinkWithGemini(
  base64Image: string,
  expectedDrinkType: string,
  mimeType: SupportedMimeType = "image/jpeg"
): Promise<DrinkVerificationResult> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      allowed: false,
      matchedDrinkType: "UNKNOWN",
      isExpectedDrinkMatch: false,
      spoofingLikely: true,
      druggingLikely: true,
      summary: "Gemini key is missing. Verification could not run.",
      concerns: ["Add EXPO_PUBLIC_GEMINI_API_KEY to enable photo verification."],
      voiceMessage: "Verification failed because Gemini is not configured.",
    };
  }

  const prompt = [
    "You are a strict beverage safety verifier for a safety app.",
    `Expected logged drink type: ${expectedDrinkType}.`,
    "Analyze the provided photo and return JSON only, with no markdown or extra text.",
    "Required JSON keys:",
    "{",
    '  "match": boolean,',
    '  "matchedDrinkType": string,',
    '  "spoofingLikely": boolean,',
    '  "druggingLikely": boolean,',
    '  "summary": string,',
    '  "concerns": string[],',
    '  "voiceMessage": string',
    "}",
    "Rules:",
    "1) match must be true only when the observed drink appears to be the same type as the expected type (e.g., SHOT must not match WINE).",
    "2) Evaluate visible indicators of spoofing/tampering (screen replay, printed image, fake container cues, obvious staging inconsistencies).",
    "3) Evaluate visible indicators that a drink may be drugged/spiked/tampered (powders, residue, unexpected cloudiness/layering, suspicious artifacts).",
    "4) If uncertain, set match=false and include why in concerns.",
    "5) Keep summary concise (<= 2 sentences) and voiceMessage natural for spoken safety guidance.",
  ].join("\n");

  const model = await resolveGeminiModel(apiKey);

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.find((part: { text?: string }) => typeof part?.text === "string")?.text ?? "";

  if (!rawText) {
    throw new Error("Gemini response was empty.");
  }

  const parsed = JSON.parse(sanitizeModelJson(rawText)) as Partial<GeminiRawResponse>;

  const match = Boolean(parsed.match);
  const spoofingLikely = Boolean(parsed.spoofingLikely);
  const druggingLikely = Boolean(parsed.druggingLikely);
  const concerns = toSafeStringArray(parsed.concerns);
  const summary = toSafeString(parsed.summary, "Unable to verify this drink from the photo.");
  const voiceMessage = toSafeString(parsed.voiceMessage, summary);
  const matchedDrinkType = toSafeString(parsed.matchedDrinkType, "UNKNOWN").toUpperCase();

  return {
    allowed: match && !spoofingLikely && !druggingLikely,
    matchedDrinkType,
    isExpectedDrinkMatch: match,
    spoofingLikely,
    druggingLikely,
    summary,
    concerns,
    voiceMessage,
  };
}
