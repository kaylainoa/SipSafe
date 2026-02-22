import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://sipsafe-backend-fwdby.ondigitalocean.app";
// const BASE_URL = "http://localhost:3000";

// replace the URL above with your full DigitalOcean URL

async function getToken() {
  return await AsyncStorage.getItem("token");
}

async function request(endpoint: string, options: any = {}) {
  const token = await getToken();
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = typeof data?.error === "string" ? data.error : `Request failed (${response.status})`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  // Auth
  register: (data: any) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: any) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),

  // Current user (profile + drink tracking)
  getMe: () => request("/api/auth/me"),
  updateProfile: (profile: Record<string, unknown>) =>
    request("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ profile }),
    }),

  // Drinks
  getDrinks: () => request("/api/drinks"),

  // Drink logs
  logDrink: (data: any) =>
    request("/api/drinklogs", { method: "POST", body: JSON.stringify(data) }),
  getLogs: () => request("/api/drinklogs"),
  getStats: () => request("/api/drinklogs/stats"),

  // Scan
  scanDrink: (imageBase64: string) =>
    request("/api/drinklogs/scan", {
      method: "POST",
      body: JSON.stringify({ imageBase64 }),
    }),

  // Identify / verify drink (spoofing check)
  identifyDrink: (base64Image: string, mimeType: string = "image/jpeg") =>
    request("/api/identifyDrink", {
      method: "POST",
      body: JSON.stringify({ base64Image, mimeType }),
    }),
};
