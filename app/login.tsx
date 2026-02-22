import { api } from "@/constants/api";
import { BebasNeue_400Regular, useFonts } from "@expo-google-fonts/bebas-neue";
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

/** Apple Glyph */
const AppleIcon = () => <Text style={s.appleIconText}></Text>;

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load the font
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
  });

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

  // Prevent rendering until fonts are ready
  if (!fontsLoaded) {
    return (
      <View style={[s.safe, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color="#FF4000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        {/* ══ HEADING ══ */}
        <View style={s.headingWrap}>
          <Text style={s.heading}>
            WELCOME TO{"\n"}
            <Text style={s.headingAccent}>SIP SAFE</Text>
          </Text>
        </View>

        {/* ══ INPUTS ══ */}
        <View style={s.inputsWrap}>
          <TextInput
            style={s.input}
            placeholder="EMAIL ADDRESS"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
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
            <Text style={s.ctaLabel}>SIGN IN</Text>
          )}
        </TouchableOpacity>

        {/* ══ Sign Up Link ══ */}
        <TouchableOpacity
          onPress={() => router.push("/register")}
          style={s.registerWrap}
        >
          <Text style={s.registerText}>
            DON'T HAVE AN ACCOUNT? <Text style={s.registerLink}>SIGN UP</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {/* ══ Social Section ══ */}
        <Text style={s.socialDividerLabel}>OR CONTINUE WITH</Text>

        <View style={s.socialRow}>
          <TouchableOpacity
            style={s.socialPill}
            onPress={() => handleSocialLogin("Google")}
          >
            <Text style={s.socialLabel}>GOOGLE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.socialPill}
            onPress={() => handleSocialLogin("Apple")}
          >
            <View style={s.socialInner}>
              <AppleIcon />
              <Text style={s.socialLabel}>APPLE</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: Platform.OS === "ios" ? 10 : 30 }} />
      </View>
    </SafeAreaView>
  );
}

const BG = "#111111";
const INPUT_BG = "#1F1F1F";
const ORANGE = "#FF4000";
const BEBAS = "BebasNeue_400Regular";

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    paddingHorizontal: 26,
  },
  headingWrap: {
    marginTop: 60,
  },
  heading: {
    fontFamily: BEBAS,
    fontSize: 56,
    lineHeight: 54,
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  headingAccent: {
    fontFamily: BEBAS,
    color: ORANGE,
  },
  inputsWrap: {
    marginTop: 44,
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
    letterSpacing: 1.2,
  },
  cta: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    height: 60,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },
  ctaLabel: {
    fontFamily: BEBAS,
    fontSize: 24,
    color: "#ffffff",
    letterSpacing: 2,
  },
  registerWrap: {
    marginTop: 20,
    alignItems: "center",
  },
  registerText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 16,
    fontFamily: BEBAS,
    letterSpacing: 1,
  },
  registerLink: {
    color: ORANGE,
  },
  socialDividerLabel: {
    marginBottom: 16,
    color: "rgba(255,255,255,0.3)",
    fontSize: 14,
    fontFamily: BEBAS,
    textAlign: "center",
    letterSpacing: 1.5,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialPill: {
    flex: 1,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1b1b1b",
    borderWidth: 1,
    borderColor: "#2e2e2e",
    borderRadius: 12,
  },
  socialInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  socialLabel: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: BEBAS,
    letterSpacing: 1,
  },
  appleIconText: {
    fontSize: 22,
    color: "#ffffff",
    marginTop: -4,
  },
});