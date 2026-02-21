import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://sipsafe-backend-fwdby.ondigitalocean.app";

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
  return response.json();
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
};
