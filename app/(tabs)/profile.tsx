import { useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const [profile] = useState({
    name: "User",
    email: "user@email.com",
    cell: "123-456-7890",
    address: "Broward Hall, Gainesville FL",
  });

  const handleLogout = () => {
    // This sends the user back to the login page outside the tabs
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenLabel}>Profile</Text>
        <View style={styles.avatar}><Text style={styles.avatarText}>U</Text></View>
        <Text style={styles.welcome}>Welcome, {profile.name}!</Text>
        
        <View style={styles.card}>
          <Text style={styles.info}>Email: {profile.email}</Text>
          <Text style={styles.info}>Cell: {profile.cell}</Text>
          <Text style={styles.info}>Address: {profile.address}</Text>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#111" },
  scrollContent: { padding: 20 },
  screenLabel: { color: "#888", marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#222", alignSelf: 'center', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#D4622A' },
  avatarText: { color: '#fff', fontSize: 40 },
  welcome: { color: "#fff", fontSize: 24, textAlign: 'center', marginVertical: 20 },
  card: { backgroundColor: "#1c1c1c", padding: 20, borderRadius: 20 },
  info: { color: "#eee", marginBottom: 10 },
  logoutBtn: { marginTop: 20, padding: 15, backgroundColor: '#D4622A', borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: 'bold' }
});
