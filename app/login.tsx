import { api } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/** Apple unicode */
const AppleIcon = () => <Text style={icon.apple}></Text>;

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!username.trim() || !password) return;
    setLoading(true);

    try {
      const result = await api.login({ email: username, password });

      if (result.token) {
        await AsyncStorage.setItem("token", result.token);
        await AsyncStorage.setItem("user", JSON.stringify(result.user));
        router.replace("/(tabs)");
      } else {
        alert(result.error || "Login failed");
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    // TODO: implement social login
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        {/* ══ HEADING ══ */}
        <View style={s.headingWrap}>
          <Text style={s.heading}>
            {"Welcome to "}
            <Text style={s.headingAccent}>SIP SAFE</Text>
          </Text>
        </View>

        {/* ══ INPUTS ══ */}
        <View style={s.inputsWrap}>
          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor="#5c5c5c"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
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
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </View>

        {/* ══ ORANGE CTA BUTTON ══ */}
        <TouchableOpacity
          style={s.cta}
          onPress={handleSubmit}
          activeOpacity={0.82}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.ctaLabel}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* ══ Sign Up Link ══ */}
        <TouchableOpacity
          onPress={() => router.push("/register")}
          style={s.registerWrap}
        >
          <Text style={s.registerText}>
            Don't have an account? <Text style={s.registerLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>

        {/* ══ "Or continue with" label ══ */}
        <Text style={s.signUpLabel}>Or continue with</Text>

        {/* ══ Push social buttons to bottom ══ */}
        <View style={{ flex: 1 }} />

        {/* ══ SOCIAL BUTTONS ══ */}
        <View style={s.socialRow}>
          <TouchableOpacity
            style={s.socialPill}
            onPress={() => handleSocialLogin("Google")}
            activeOpacity={0.8}
          >
            <Text style={s.socialLabel}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.socialPill}
            onPress={() => handleSocialLogin("Apple")}
            activeOpacity={0.8}
          >
            <View style={s.appleInner}>
              <AppleIcon />
              <Text style={s.socialLabel}>Apple</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </View>
    </SafeAreaView>
  );
}

const BG = "#111111";
const INPUT_BG = "#242424";
const ORANGE = "#e8541a";
const SERIF = "InstrumentSerif-Regular";
const SANS = Platform.select({ ios: "System", android: "sans-serif" });

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
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
    fontSize: 40,
    lineHeight: 50,
    color: "#ffffff",
    textAlign: "left",
    letterSpacing: -0.5,
  },
  headingAccent: {
    fontFamily: SERIF,
    fontSize: 40,
    color: "#ffffff",
  },

  /* ── Inputs ── */
  inputsWrap: {
    marginTop: 56,
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

  /* ── Orange CTA ── */
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

  /* ── Register link ── */
  registerWrap: {
    marginTop: 16,
    alignItems: "center",
  },
  registerText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    fontFamily: SANS,
  },
  registerLink: {
    color: ORANGE,
    fontWeight: "600",
  },

  /* ── "Or continue with" ── */
  signUpLabel: {
    marginTop: 24,
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    fontFamily: SANS,
    textAlign: "center",
    letterSpacing: 0.2,
  },

  /* ── Social row ── */
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: "#1b1b1b",
    borderWidth: 1,
    borderColor: "#2e2e2e",
    borderRadius: 100,
    paddingVertical: 14,
  },
  socialLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: SANS,
  },
  appleInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginRight: 14,
  },
});

const icon = StyleSheet.create({
  apple: {
    fontSize: 19,
    color: "#ffffff",
    lineHeight: 21,
    marginTop: Platform.OS === "android" ? 0 : -2,
  },
});
