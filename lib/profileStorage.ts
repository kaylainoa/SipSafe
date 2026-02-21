import AsyncStorage from "@react-native-async-storage/async-storage";

export interface EmergencyContact {
  label: string;
  phone: string;
  carrier: string;
}

export interface ProfileData {
  name: string;
  email: string;
  dob: string;
  weight: string;
  cell: string;
  address: string;
  bloodType: string;
  emergencyContacts: EmergencyContact[];
}

export const PROFILE_STORAGE_KEY = "sipsafe.profile.v1";

export const DEFAULT_PROFILE: ProfileData = {
  name: "User",
  email: "user@email.com",
  dob: "01/01/2000",
  weight: "130",
  cell: "123-456-7890",
  address: "Broward Hall, Gainesville FL, 32612",
  bloodType: "O+",
  emergencyContacts: [
    { label: "Mom", phone: "123 456 7890", carrier: "verizon" },
    { label: "BFF", phone: "123 456 7890", carrier: "att" },
  ],
};

function isProfileData(value: unknown): value is ProfileData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    typeof v.email === "string" &&
    typeof v.dob === "string" &&
    typeof v.weight === "string" &&
    typeof v.cell === "string" &&
    typeof v.address === "string" &&
    typeof v.bloodType === "string" &&
    Array.isArray(v.emergencyContacts)
  );
}

function normalizeEmergencyContact(value: unknown): EmergencyContact {
  const v = (value || {}) as Record<string, unknown>;
  return {
    label: typeof v.label === "string" ? v.label : "",
    phone: typeof v.phone === "string" ? v.phone : "",
    carrier: typeof v.carrier === "string" ? v.carrier : "",
  };
}

export async function loadProfileData(): Promise<ProfileData> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    if (!isProfileData(parsed)) return DEFAULT_PROFILE;
    return {
      ...parsed,
      emergencyContacts: parsed.emergencyContacts.map(normalizeEmergencyContact),
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveProfileData(profile: ProfileData): Promise<void> {
  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export async function getEmergencyContactsFromStorage(): Promise<EmergencyContact[]> {
  const profile = await loadProfileData();
  return profile.emergencyContacts.filter(
    (c) => c.label.trim().length > 0 && c.phone.trim().length > 0
  );
}
