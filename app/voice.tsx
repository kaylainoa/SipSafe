import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function VoiceScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice AI</Text>
      <Text style={styles.subtitle}>Safety guidance — coming soon</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111", justifyContent: "center", alignItems: "center", padding: 20 },
  title: { color: "#fff", fontSize: 24, marginBottom: 8 },
  subtitle: { color: "#888", marginBottom: 24 },
  btn: { backgroundColor: "#ff4000", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  btnText: { color: "#fff", fontSize: 16 },
});
