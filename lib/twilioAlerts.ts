import type { EmergencyContact } from "@/lib/profileStorage";
import Constants from "expo-constants";

interface AlertSmsResponse {
  ok: boolean;
  attempted: number;
  sent: Array<{ to: string; sid: string }>;
  failed: Array<{ to: string; error: string }>;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function getExpoHostIp(): string | null {
  const hostUri = (Constants.expoConfig as { hostUri?: string } | null)?.hostUri;
  if (hostUri && hostUri.includes(":")) {
    return hostUri.split(":")[0];
  }

  const debuggerHost = (Constants.manifest2 as { extra?: { expoGo?: { debuggerHost?: string } } } | null)
    ?.extra?.expoGo?.debuggerHost;
  if (debuggerHost && debuggerHost.includes(":")) {
    return debuggerHost.split(":")[0];
  }

  return null;
}

function getCandidateBaseUrls(): string[] {
  const configured = [
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim(),
    process.env.EXPO_PUBLIC_SERVER_URL?.trim(),
  ].filter((v): v is string => Boolean(v));

  const hostIp = getExpoHostIp();
  const inferred = hostIp ? [`http://${hostIp}:3000`] : [];

  const fallbacks = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://10.0.2.2:3000",
  ];

  return [...new Set([...configured, ...inferred, ...fallbacks].map(normalizeBaseUrl))];
}

function isNetworkFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("network request failed") || msg.includes("failed to fetch");
}

export async function sendEmergencySms(
  contacts: EmergencyContact[],
  message: string
): Promise<AlertSmsResponse> {
  const baseUrls = getCandidateBaseUrls();
  let lastNetworkError: Error | null = null;

  for (const baseUrl of baseUrls) {
    try {
      const response = await fetch(`${baseUrl}/api/alerts/emergency-sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts, message }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || `Alert request failed (${response.status})`);
      }
      return data as AlertSmsResponse;
    } catch (error) {
      if (isNetworkFailure(error)) {
        lastNetworkError =
          error instanceof Error ? error : new Error("Unknown network error");
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    `Network request failed. Could not reach backend. Set EXPO_PUBLIC_API_BASE_URL to your computer's LAN URL (example: http://192.168.1.20:3000). Last error: ${lastNetworkError?.message ?? "unknown"}`
  );
}
