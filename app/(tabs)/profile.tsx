import { api } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmergencyContact {
  label: string;
  phone: string;
}

interface ProfileData {
  name: string;
  email: string;
  dob: string;
  weight: string;
  cell: string;
  address: string;
  bloodType: string;
  emergencyContacts: EmergencyContact[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoRow = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, accent && styles.infoLabelAccent]}>
      {label}
    </Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EditModal = ({
  visible,
  profile,
  onSave,
  onClose,
  saving,
}: {
  visible: boolean;
  profile: ProfileData;
  onSave: (p: ProfileData) => void | Promise<void | boolean>;
  onClose: () => void;
  saving?: boolean;
}) => {
  const [draft, setDraft] = useState<ProfileData>(profile);

  React.useEffect(() => {
    if (visible) setDraft(profile);
  }, [visible, profile]);

  const update = (key: keyof ProfileData, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const contacts = [...draft.emergencyContacts];
    contacts[index] = { ...contacts[index], [field]: value };
    setDraft((prev) => ({ ...prev, emergencyContacts: contacts }));
  };

  const addContact = () => {
    if (draft.emergencyContacts.length >= 4) {
      Alert.alert("Max 4 emergency contacts");
      return;
    }
    setDraft((prev) => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, { label: "", phone: "" }],
    }));
  };

  const removeContact = (index: number) => {
    const contacts = draft.emergencyContacts.filter((_, i) => i !== index);
    setDraft((prev) => ({ ...prev, emergencyContacts: contacts }));
  };

  const handleSave = () => {
    void Promise.resolve(onSave(draft)).then((ok) => {
      if (ok !== false) onClose();
    });
  };

  const Field = ({
    label,
    value,
    field,
    placeholder,
    keyboardType,
  }: {
    label: string;
    value: string;
    field: keyof ProfileData;
    placeholder?: string;
    keyboardType?: any;
  }) => (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={(v) => update(field, v)}
        placeholder={placeholder ?? label}
        placeholderTextColor="#555"
        keyboardType={keyboardType ?? "default"}
        selectionColor="#ff4000"
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Field label="Full Name" value={draft.name} field="name" />
              <Field label="Email" value={draft.email} field="email" keyboardType="email-address" />
              <Field label="Date of Birth" value={draft.dob} field="dob" placeholder="MM/DD/YYYY" />
              <Field label="Weight (lbs)" value={draft.weight} field="weight" keyboardType="numeric" />
              <Field label="Blood Type" value={draft.bloodType} field="bloodType" placeholder="e.g. O+" />
              <Field label="Cell" value={draft.cell} field="cell" keyboardType="phone-pad" />
              <Field label="Address" value={draft.address} field="address" />

              <Text style={styles.sectionTitle}>Emergency Contacts</Text>
              {draft.emergencyContacts.map((contact, i) => (
                <View key={i} style={styles.contactBlock}>
                  <View style={styles.contactRow}>
                    <TextInput
                      style={[styles.textInput, { flex: 1, marginRight: 8 }]}
                      value={contact.label}
                      onChangeText={(v) => updateContact(i, "label", v)}
                      placeholder="Label (e.g. Mom)"
                      placeholderTextColor="#555"
                      selectionColor="#ff4000"
                    />
                    <TouchableOpacity onPress={() => removeContact(i)} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    value={contact.phone}
                    onChangeText={(v) => updateContact(i, "phone", v)}
                    placeholder="Phone number"
                    placeholderTextColor="#555"
                    keyboardType="phone-pad"
                    selectionColor="#ff4000"
                  />
                </View>
              ))}
              <TouchableOpacity style={styles.addContactBtn} onPress={addContact}>
                <Text style={styles.addContactText}>+ Add Contact</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? "Saving…" : "Save Changes"}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

type BackendProfile = {
  name?: string;
  weightLbs?: number;
  heightFt?: number;
  heightIn?: number;
  gender?: string;
  dateOfBirth?: string | Date;
  cell?: string;
  address?: string;
  bloodType?: string;
  emergencyContacts?: { label?: string; phone?: string }[];
};

function userToProfileData(user: { email?: string; profile?: BackendProfile; id?: string } | null): ProfileData {
  if (!user) {
    return {
      name: "User",
      email: "",
      dob: "",
      weight: "",
      cell: "",
      address: "",
      bloodType: "",
      emergencyContacts: [],
    };
  }
  const p = user.profile;
  const dob =
    p?.dateOfBirth instanceof Date
      ? p.dateOfBirth.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
      : typeof p?.dateOfBirth === "string"
        ? p.dateOfBirth
        : "";
  return {
    name: p?.name ?? "User",
    email: user.email ?? "",
    dob,
    weight: p?.weightLbs != null ? String(p.weightLbs) : "",
    cell: p?.cell ?? "",
    address: p?.address ?? "",
    bloodType: p?.bloodType ?? "",
    emergencyContacts: Array.isArray(p?.emergencyContacts)
      ? p.emergencyContacts.map((c) => ({ label: c?.label ?? "", phone: c?.phone ?? "" }))
      : [],
  };
}

function profileDataToBackend(d: ProfileData): Record<string, unknown> {
  const weight = d.weight.trim() ? parseFloat(d.weight) : undefined;
  let dateOfBirth: string | undefined;
  if (d.dob.trim()) {
    const parts = d.dob.split("/");
    if (parts.length === 3) {
      const [mo, day, year] = parts;
      dateOfBirth = `${year}-${mo.padStart(2, "0")}-${day.padStart(2, "0")}`;
    } else {
      dateOfBirth = d.dob;
    }
  }
  return {
    name: d.name.trim() || undefined,
    weightLbs: weight != null && !Number.isNaN(weight) ? weight : undefined,
    dateOfBirth: dateOfBirth || undefined,
    cell: d.cell.trim(),
    address: d.address.trim(),
    bloodType: d.bloodType.trim(),
    emergencyContacts: d.emergencyContacts,
  };
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>({
    name: "User",
    email: "",
    dob: "",
    weight: "",
    cell: "",
    address: "",
    bloodType: "",
    emergencyContacts: [],
  });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile(userToProfileData(parsed));
      }
      const me = await api.getMe();
      if (me?.profile != null && !me.error) {
        const asUser = { id: me.id, email: me.email, profile: me.profile };
        setProfile(userToProfileData(asUser));
        await AsyncStorage.setItem("user", JSON.stringify(asUser));
      }
    } catch {
      // use stored or defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    router.replace("/login");
  };

  const handleSaveProfile = useCallback(async (draft: ProfileData): Promise<boolean> => {
    const token = await AsyncStorage.getItem("token");
    if (!token?.trim()) {
      Alert.alert(
        "Sign in required",
        "Your session has expired or you are not signed in. Please sign in again to save your profile.",
        [{ text: "OK", onPress: () => router.replace("/login") }],
      );
      return false;
    }
    setSaving(true);
    try {
      const payload = profileDataToBackend(draft);
      const updated = await api.updateProfile(payload);
      if (updated?.profile != null) {
        const asUser = { id: updated.id, email: updated.email, profile: updated.profile };
        setProfile(userToProfileData(asUser));
        await AsyncStorage.setItem("user", JSON.stringify(asUser));
        return true;
      }
      return false;
    } catch (err) {
      const raw =
        (err instanceof Error && err.message) || String(err).replace(/^Error:\s*/, "") || "Profile could not be updated. Try again.";
      const isAuthError = /authentication required|invalid or expired token/i.test(raw);
      const message = isAuthError
        ? "Your session may have expired. Please sign in again to save your profile."
        : raw;
      Alert.alert(
        "Could not save",
        message,
        isAuthError ? [{ text: "OK", onPress: () => router.replace("/login") }] : undefined,
      );
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  if (loading) {
    return (
      <ImageBackground
        source={require("@/assets/images/background.png")}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safe}>
          <StatusBar barStyle="light-content" backgroundColor="transparent" />
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>Loading profile…</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("@/assets/images/background.png")}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" />

        <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navPill}>
          <Text style={styles.navPillText}>PROFILE DOSSIER</Text>
        </View>

        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{getInitials(profile.name)}</Text>
          </View>
        </View>

        <Text style={styles.welcome}>WELCOME, {profile.name.split(" ")[0]}!</Text>
        <Text style={styles.subWelcome}>ACCOUNT + SAFETY CONTACTS</Text>

        <View style={styles.card}>
          <InfoRow label="Name:" value={profile.name} />
          <Divider />
          <InfoRow label="Email:" value={profile.email} />
          <Divider />
          <InfoRow label="Date of Birth:" value={profile.dob} />
          <Divider />
          <InfoRow label="Weight:" value={`${profile.weight} lbs`} />
          <Divider />
          <InfoRow label="Blood Type:" value={profile.bloodType} />
          <Divider />
          <InfoRow label="Cell:" value={profile.cell} />
          <Divider />
          <InfoRow label="Address:" value={profile.address} />
          <Divider />

          <View style={styles.emergencyBlock}>
            <Text style={[styles.infoLabel, styles.infoLabelAccent]}>
              Emergency{"\n"}Contacts:
            </Text>
            <View style={styles.contactsRight}>
              {profile.emergencyContacts.map((c, i) => (
                <Text key={i} style={styles.infoValue}>
                  {c.label} – {c.phone}
                </Text>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
            <Text style={styles.editBtnText}>EDIT INFO</Text>
          </TouchableOpacity>

          {/* 4. Logout Button */}
          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>SIGN OUT</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>

        <EditModal
          visible={modalVisible}
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setModalVisible(false)}
          saving={saving}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ORANGE = "#ff4000";
const BG = "#111111";
const CARD_BG = "#1C1C1C";
const TEXT = "#F0EDE8";
const MUTED = "#888";
const BORDER = "#2A2A2A";

const styles = StyleSheet.create({
  bgImage: { flex: 1 },
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  navPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(34,34,34,0.92)",
    borderWidth: 1,
    borderColor: "#3A3A3A",
    borderRadius: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 18,
  },
  navPillText: {
    color: "#A8A8A8",
    fontSize: 12,
    fontFamily: "BebasNeue",
    letterSpacing: 1.5,
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: "#2E2E2E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: ORANGE,
    shadowColor: ORANGE,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  avatarInitials: {
    color: TEXT,
    fontSize: 42,
    fontFamily: "BebasNeue",
    fontWeight: "700",
    letterSpacing: 2,
  },
  welcome: {
    color: TEXT,
    fontSize: 36,
    fontFamily: "BebasNeue",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 1.4,
  },
  subWelcome: {
    color: "#7E7E7E",
    fontSize: 11,
    fontFamily: "BebasNeue",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 2,
  },
  card: {
    backgroundColor: "rgba(17,17,17,0.88)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#2F2F2F",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoLabel: {
    color: TEXT,
    fontSize: 13,
    fontFamily: "BebasNeue",
    letterSpacing: 1.1,
    flex: 1,
  },
  infoLabelAccent: {
    color: ORANGE,
  },
  infoValue: {
    color: TEXT,
    fontSize: 14,
    fontFamily: "BebasNeue",
    letterSpacing: 0.7,
    textAlign: "right",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
  },
  emergencyBlock: {
    flexDirection: "row",
    paddingVertical: 14,
    alignItems: "flex-start",
  },
  contactsRight: {
    flex: 1,
    alignItems: "flex-end",
    gap: 4,
  },
  editBtn: {
    backgroundColor: ORANGE,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
    shadowColor: ORANGE,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  editBtnText: {
    color: TEXT,
    fontSize: 16,
    fontFamily: "BebasNeue",
    fontWeight: "700",
    letterSpacing: 2.2,
  },
  // Added Logout Styles
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 10,
  },
  logoutText: {
    color: MUTED,
    fontSize: 13,
    textDecorationLine: 'underline',
    fontFamily: "BebasNeue",
    letterSpacing: 1.2,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: MUTED,
    fontSize: 16,
    fontFamily: "BebasNeue",
  },
  // ── Modal Styles (No changes below) ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: TEXT,
    fontSize: 22,
    fontFamily: "BebasNeue",
  },
  modalClose: {
    color: MUTED,
    fontSize: 18,
    padding: 4,
  },
  sectionTitle: {
    color: ORANGE,
    fontSize: 15,
    fontFamily: "BebasNeue",
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  fieldWrapper: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: MUTED,
    fontSize: 12,
    marginBottom: 6,
    letterSpacing: 0.6,
    fontFamily: "BebasNeue",
  },
  textInput: {
    backgroundColor: "#252525",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TEXT,
    fontSize: 15,
    fontFamily: "BebasNeue",
    borderWidth: 1,
    borderColor: BORDER,
  },
  contactBlock: {
    marginBottom: 14,
    gap: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  removeBtn: {
    backgroundColor: "#2E2E2E",
    borderRadius: 8,
    padding: 10,
  },
  removeBtnText: {
    color: ORANGE,
    fontSize: 14,
  },
  addContactBtn: {
    borderWidth: 1,
    borderColor: ORANGE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  addContactText: {
    color: ORANGE,
    fontSize: 15,
    fontFamily: "BebasNeue",
  },
  saveBtn: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: {
    color: TEXT,
    fontSize: 18,
    fontFamily: "BebasNeue",
  },
});
