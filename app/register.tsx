import { api } from "@/constants/api";
import { BebasNeue_400Regular, useFonts } from "@expo-google-fonts/bebas-neue";
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

  // Load Bebas Neue
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
  });

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

  if (!fontsLoaded) {
    return (
      <View style={[s.safe, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color="#ff4000" />
      </View>
    );
  }

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
              CREATE YOUR{"\n"}
              <Text style={s.headingAccent}>SIP SAFE</Text> ACCOUNT
            </Text>
          </View>

          {/* ══ INPUTS ══ */}
          <View style={s.inputsWrap}>
            <TextInput
              style={s.input}
              placeholder="FULL NAME"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />
            <TextInput
              style={s.input}
              placeholder="EMAIL ADDRESS"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
            <TextInput
              style={s.input}
              placeholder="PASSWORD"
              placeholderTextColor="rgba(255,255,255,0.3)"
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
                placeholder="HEIGHT (FT)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={heightFt}
                onChangeText={setHeightFt}
                keyboardType="numeric"
                returnKeyType="next"
              />
              <TextInput
                style={[s.input, s.halfInput]}
                placeholder="HEIGHT (IN)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={heightIn}
                onChangeText={setHeightIn}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>

            {/* ══ WEIGHT ══ */}
            <TextInput
              style={s.input}
              placeholder="WEIGHT (LBS)"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={weightLbs}
              onChangeText={setWeightLbs}
              keyboardType="numeric"
              returnKeyType="done"
            />

            {/* ══ GENDER SELECTOR ══ */}
            <Text style={s.sectionLabel}>GENDER</Text>
            <View style={s.genderRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[s.genderPill, gender === g && s.genderPillActive]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[
                      s.genderLabel,
                      gender === g && s.genderLabelActive,
                    ]}
                  >
                    {g.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.disclaimer}>
              YOUR WEIGHT AND HEIGHT ARE USED ONLY TO ESTIMATE BAC. DATA IS
              STORED SECURELY AND NEVER SHARED.
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
              <Text style={s.ctaLabel}>CREATE ACCOUNT</Text>
            )}
          </TouchableOpacity>

          {/* ══ LOGIN LINK ══ */}
          <TouchableOpacity onPress={() => router.back()} style={s.loginWrap}>
            <Text style={s.loginText}>
              ALREADY HAVE AN ACCOUNT?{" "}
              <Text style={s.loginLink}>SIGN IN</Text>
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const BG = "#111111";
const INPUT_BG = "#1F1F1F";
const ORANGE = "#ff4000";
const BEBAS = "BebasNeue_400Regular";

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
    paddingHorizontal: 26,
    paddingTop: Platform.OS === "android" ? 44 : 16,
  },

  /* ── Heading ── */
  headingWrap: {
    marginTop: 36,
  },
  heading: {
    fontFamily: BEBAS,
    fontSize: 48,
    lineHeight: 46,
    color: "#ffffff",
    textAlign: "left",
    letterSpacing: 0.5,
  },
  headingAccent: {
    fontFamily: BEBAS,
    color: ORANGE,
  },

  /* ── Inputs ── */
  inputsWrap: {
    marginTop: 40,
    gap: 12,
  },
  input: {
    backgroundColor: INPUT_BG,
    color: "#ffffff",
    fontSize: 20,
    fontFamily: BEBAS,
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: 12,
    letterSpacing: 1,
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
    fontSize: 16,
    fontFamily: BEBAS,
    marginLeft: 8,
    marginBottom: -4,
    letterSpacing: 1,
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
  },
  genderPill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
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
    fontSize: 18,
    fontFamily: BEBAS,
    letterSpacing: 0.5,
  },
  genderLabelActive: {
    color: "#ffffff",
  },

  /* ── Disclaimer ── */
  disclaimer: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 13,
    fontFamily: BEBAS,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 8,
    letterSpacing: 0.5,
  },

  /* ── CTA ── */
  cta: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    height: 60,
    marginTop: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },
  ctaLabel: {
    fontFamily: BEBAS,
    fontSize: 26,
    color: "#ffffff",
    letterSpacing: 1.5,
  },

  /* ── Login link ── */
  loginWrap: {
    marginTop: 20,
    alignItems: "center",
  },
  loginText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 16,
    fontFamily: BEBAS,
    letterSpacing: 1,
  },
  loginLink: {
    color: ORANGE,
  },
});