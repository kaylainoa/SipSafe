import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
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
}: {
  visible: boolean;
  profile: ProfileData;
  onSave: (p: ProfileData) => void;
  onClose: () => void;
}) => {
  const [draft, setDraft] = useState<ProfileData>(profile);

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
    onSave(draft);
    onClose();
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
        selectionColor="#D4622A"
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
                      selectionColor="#D4622A"
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
                    selectionColor="#D4622A"
                  />
                </View>
              ))}
              <TouchableOpacity style={styles.addContactBtn} onPress={addContact}>
                <Text style={styles.addContactText}>+ Add Contact</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
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

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData>({
    name: "User",
    email: "user@email.com",
    dob: "01/01/2000",
    weight: "130",
    cell: "123-456-7890",
    address: "Broward Hall, Gainesville FL, 32612",
    bloodType: "O+",
    emergencyContacts: [
      { label: "Mom", phone: "123 456 7890" },
      { label: "BFF", phone: "123 456 7890" },
    ],
  });

  const [modalVisible, setModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header label */}
        <Text style={styles.screenLabel}>Profile</Text>

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{getInitials(profile.name)}</Text>
          </View>
        </View>

        {/* Welcome */}
        <Text style={styles.welcome}>Welcome, {profile.name.split(" ")[0]}!</Text>

        {/* Info Card */}
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

          {/* Emergency contacts */}
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

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.editBtnText}>Edit Info</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EditModal
        visible={modalVisible}
        profile={profile}
        onSave={setProfile}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ORANGE = "#D4622A";
const BG = "#111111";
const CARD_BG = "#1C1C1C";
const TEXT = "#F0EDE8";
const MUTED = "#888";
const BORDER = "#2A2A2A";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  screenLabel: {
    color: MUTED,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 14,
    marginTop: 12,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#2E2E2E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: ORANGE,
  },
  avatarInitials: {
    color: TEXT,
    fontSize: 38,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: 2,
  },
  welcome: {
    color: TEXT,
    fontSize: 30,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    textAlign: "center",
    marginBottom: 28,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoLabel: {
    color: TEXT,
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    flex: 1,
  },
  infoLabelAccent: {
    color: ORANGE,
  },
  infoValue: {
    color: TEXT,
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
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
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  editBtnText: {
    color: TEXT,
    fontSize: 18,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: 0.5,
  },

  // ── Modal ──
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
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  modalClose: {
    color: MUTED,
    fontSize: 18,
    padding: 4,
  },
  sectionTitle: {
    color: ORANGE,
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
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
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  textInput: {
    backgroundColor: "#252525",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TEXT,
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
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
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
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
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
});
