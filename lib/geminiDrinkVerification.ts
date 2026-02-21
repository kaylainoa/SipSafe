type SupportedMimeType = "image/jpeg" | "image/png" | "image/webp";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL = "gemini-pro";
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
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");
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
  return input
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toConciseVoiceMessage(input: string, fallback: string): string {
  const base =
    toSafeString(input) || toSafeString(fallback) || "Unable to verify drink.";
  const sentences = base
    .split(/[.!?]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const combined = sentences.slice(0, 2).join(". ").trim() || base;
  const words = combined.split(/\s+/).filter(Boolean).slice(0, 20);
  const concise = words.join(" ").trim();
  return concise ? `${concise}.` : "Unable to verify drink.";
}

async function resolveGeminiModel(apiKey: string): Promise<string> {
  if (cachedModel) return cachedModel;
  const listResp = await fetch(
    `${GEMINI_API_BASE}/models?key=${encodeURIComponent(apiKey)}`,
  );
  if (!listResp.ok) {
    const err = await listResp.text();
    throw new Error(`Gemini model discovery failed: ${listResp.status} ${err}`);
  }

  const listData = await listResp.json();
  const modelNames: string[] = (listData?.models ?? [])
    .filter(
      (m: { name?: string; supportedGenerationMethods?: string[] }) =>
        Array.isArray(m?.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes("generateContent"),
    )
    .map((m: { name?: string }) => (m.name ?? "").replace(/^models\//, ""))
    .filter(Boolean);

  const fromList =
    modelNames.find((name) => name.includes("pro")) ?? modelNames[0];

  if (!fromList) {
    throw new Error(
      "No Gemini model with generateContent support was found for this API key.",
    );
  }

  cachedModel = fromList;
  return cachedModel;
}

async function generateWithModel(
  apiKey: string,
  model: string,
  prompt: string,
  base64Image: string,
  mimeType: SupportedMimeType,
): Promise<Response> {
  return fetch(
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
          maxOutputTokens: 500,
        },
      }),
    },
  );
}

export async function verifyDrinkWithGemini(
  base64Image: string,
  expectedDrinkType: string,
  mimeType: SupportedMimeType = "image/jpeg",
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
      concerns: [
        "Add EXPO_PUBLIC_GEMINI_API_KEY to enable photo verification.",
      ],
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
    "1a) For expected COCKTAIL, a mixed drink in a red solo cup can still be a valid match.",
    "2) Evaluate visible indicators of spoofing/tampering (screen replay, printed image, fake container cues, obvious staging inconsistencies).",
    "3) Evaluate visible indicators that a drink may be roofied/drugged/spiked/tampered (powders, residue, dissolved tablets, unusual cloudiness/layering, suspicious artifacts).",
    "4) If uncertain, set match=false and include why in concerns.",
    "5) Keep summary concise (<= 2 sentences).",
    "6) voiceMessage must be direct and short (max 20 words).",
    "7) If spoofingLikely is true, voiceMessage must say the spoofing sign(s) briefly.",
  ].join("\n");

  const configuredModel = process.env.EXPO_PUBLIC_GEMINI_MODEL?.trim();
  const primaryModel = cachedModel || configuredModel || DEFAULT_GEMINI_MODEL;
  let response = await generateWithModel(
    apiKey,
    primaryModel,
    prompt,
    base64Image,
    mimeType,
  );

  if (!response.ok && (response.status === 404 || response.status === 400)) {
    const discoveredModel = await resolveGeminiModel(apiKey);
    if (discoveredModel !== primaryModel) {
      response = await generateWithModel(
        apiKey,
        discoveredModel,
        prompt,
        base64Image,
        mimeType,
      );
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  // Debug: Log the full Gemini API response
  console.log("Gemini API response:", JSON.stringify(data, null, 2));
  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.find(
      (part: { text?: string }) => typeof part?.text === "string",
    )?.text ?? "";

  if (!rawText) {
    throw new Error("Gemini response was empty.");
  }

  const parsed = JSON.parse(
    sanitizeModelJson(rawText),
  ) as Partial<GeminiRawResponse>;

  const match = Boolean(parsed.match);
  const spoofingLikely = Boolean(parsed.spoofingLikely);
  const druggingLikely = Boolean(parsed.druggingLikely);
  const concerns = toSafeStringArray(parsed.concerns);
  const summary = toSafeString(
    parsed.summary,
    "Unable to verify this drink from the photo.",
  );
  const matchedDrinkType = toSafeString(
    parsed.matchedDrinkType,
    "UNKNOWN",
  ).toUpperCase();

  // Allow common mixed-drink presentation in red solo cups when COCKTAIL is expected.
  const isCocktailSoloCupMatch =
    expectedDrinkType.toUpperCase() === "COCKTAIL" &&
    matchedDrinkType.includes("SOLO CUP");

  const isExpectedDrinkMatch = Boolean(parsed.match) || isCocktailSoloCupMatch;
  const voiceFallback = !isExpectedDrinkMatch
    ? `Mismatch. Expected ${expectedDrinkType}, not ${matchedDrinkType}.`
    : spoofingLikely
      ? `Warning. Spoofing signs detected: ${concerns.slice(0, 2).join(", ") || "staged or fake-image indicators"}.`
      : druggingLikely
        ? "Warning. Possible roofie or spiking signs detected."
        : "Drink verified.";
  const voiceMessage = toConciseVoiceMessage(
    toSafeString(parsed.voiceMessage),
    voiceFallback,
  );

  return {
    allowed: isExpectedDrinkMatch && !spoofingLikely && !druggingLikely,
    matchedDrinkType,
    isExpectedDrinkMatch,
    spoofingLikely,
    druggingLikely,
    summary,
    concerns,
    voiceMessage,
  };
}
