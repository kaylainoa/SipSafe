import { api } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const GENDERS = ["male", "female", "other"];

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [gender, setGender] = useState("male");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !weightLbs || !heightFt) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const result = await api.register({
        email,
        password,
        profile: {
          name,
          weightLbs: parseFloat(weightLbs),
          heightFt: parseInt(heightFt),
          heightIn: parseInt(heightIn || "0"),
          gender,
        },
      });

      if (result.token) {
        await AsyncStorage.setItem("token", result.token);
        await AsyncStorage.setItem("user", JSON.stringify(result.user));
        router.replace("/(tabs)");
      } else {
        alert(result.error || "Registration failed");
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.container}>
          {/* ══ HEADING ══ */}
          <View style={s.headingWrap}>
            <Text style={s.heading}>
              {"Create your "}
              <Text style={s.headingAccent}>SIP SAFE</Text>
              {"\naccount"}
            </Text>
          </View>

          {/* ══ INPUTS ══ */}
          <View style={s.inputsWrap}>
            <TextInput
              style={s.input}
              placeholder="Full Name"
              placeholderTextColor="#5c5c5c"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor="#5c5c5c"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor="#5c5c5c"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              returnKeyType="next"
            />

            {/* ══ HEIGHT ROW ══ */}
            <View style={s.row}>
              <TextInput
                style={[s.input, s.halfInput]}
                placeholder="Height (ft)"
                placeholderTextColor="#5c5c5c"
                value={heightFt}
                onChangeText={setHeightFt}
                keyboardType="numeric"
                returnKeyType="next"
              />
              <TextInput
                style={[s.input, s.halfInput]}
                placeholder="Height (in)"
                placeholderTextColor="#5c5c5c"
                value={heightIn}
                onChangeText={setHeightIn}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>

            {/* ══ WEIGHT ══ */}
            <TextInput
              style={s.input}
              placeholder="Weight (lbs)"
              placeholderTextColor="#5c5c5c"
              value={weightLbs}
              onChangeText={setWeightLbs}
              keyboardType="numeric"
              returnKeyType="done"
            />

            {/* ══ GENDER SELECTOR ══ */}
            <Text style={s.sectionLabel}>Gender</Text>
            <View style={s.genderRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[s.genderPill, gender === g && s.genderPillActive]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[s.genderLabel, gender === g && s.genderLabelActive]}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.disclaimer}>
              Your weight and height are used only to estimate BAC. This data is
              stored securely and never shared.
            </Text>
          </View>

          {/* ══ CTA BUTTON ══ */}
          <TouchableOpacity
            style={s.cta}
            onPress={handleRegister}
            activeOpacity={0.82}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.ctaLabel}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* ══ LOGIN LINK ══ */}
          <TouchableOpacity onPress={() => router.back()} style={s.loginWrap}>
            <Text style={s.loginText}>
              Already have an account? <Text style={s.loginLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const BG = "#111111";
const INPUT_BG = "#242424";
const ORANGE = "#ff4000";
const SERIF = "InstrumentSerif-Regular";
const SANS = Platform.select({ ios: "System", android: "sans-serif" });

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 26,
    paddingTop: Platform.OS === "android" ? 44 : 16,
  },

  /* ── Heading ── */
  headingWrap: {
    marginTop: 36,
  },
  heading: {
    fontFamily: SERIF,
    fontSize: 38,
    lineHeight: 48,
    color: "#ffffff",
    textAlign: "left",
    letterSpacing: -0.5,
  },
  headingAccent: {
    fontFamily: SERIF,
    fontSize: 38,
    color: ORANGE,
  },

  /* ── Inputs ── */
  inputsWrap: {
    marginTop: 40,
    gap: 14,
  },
  input: {
    backgroundColor: INPUT_BG,
    color: "#ffffff",
    fontSize: 18,
    fontFamily: SERIF,
    paddingVertical: 17,
    paddingHorizontal: 22,
    borderRadius: 100,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },

  /* ── Gender ── */
  sectionLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontFamily: SANS,
    marginLeft: 8,
    marginBottom: -4,
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
  },
  genderPill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 100,
    backgroundColor: INPUT_BG,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2e2e2e",
  },
  genderPillActive: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  genderLabel: {
    color: "#666",
    fontSize: 14,
    fontFamily: SANS,
    fontWeight: "500",
  },
  genderLabelActive: {
    color: "#ffffff",
  },

  /* ── Disclaimer ── */
  disclaimer: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    fontFamily: SANS,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 8,
  },

  /* ── CTA ── */
  cta: {
    backgroundColor: ORANGE,
    borderRadius: 100,
    height: 58,
    marginTop: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  ctaLabel: {
    fontFamily: SERIF,
    fontSize: 22,
    color: "#ffffff",
    letterSpacing: 0.3,
  },

  /* ── Login link ── */
  loginWrap: {
    marginTop: 20,
    alignItems: "center",
  },
  loginText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    fontFamily: SANS,
  },
  loginLink: {
    color: ORANGE,
    fontWeight: "600",
  },
});
