import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FEATURES = [
  { icon: "🍹", title: "AI Scanner", desc: "Identify drinks" },
  { icon: "📊", title: "Dashboard", desc: "Track trends" },
  { icon: "🔔", title: "Alerts", desc: "Notify crew" },
  { icon: "🎙️", title: "Voice AI", desc: "Safety guidance" },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <Text style={styles.logo}>Sip<Text style={{color: '#e8541a'}}>Safe</Text></Text>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Text style={styles.navBtn}>Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.welcome}>Hey, Friend 👋</Text>
        <Text style={styles.desc}>Your AI safety companion is ready.</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statNum}>2</Text><Text style={styles.statLabel}>Logged</Text></View>
          <View style={styles.statCard}><Text style={[styles.statNum, {color: '#4ade80'}]}>92%</Text><Text style={styles.statLabel}>Safety</Text></View>
          <View style={styles.statCard}><Text style={styles.statNum}>3</Text><Text style={styles.statLabel}>Crew</Text></View>
        </View>

        <View style={styles.grid}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <Text style={{fontSize: 30}}>{f.icon}</Text>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 60, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#222' },
  logo: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  navBtn: { color: '#666', fontSize: 14 },
  body: { padding: 20 },
  welcome: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  desc: { color: '#666', marginTop: 5, marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 15, width: '31%', alignItems: 'center' },
  statNum: { color: '#e8541a', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#444', fontSize: 10, marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { backgroundColor: '#1a1a1a', width: '48%', padding: 20, borderRadius: 20, marginBottom: 15 },
  featureTitle: { color: '#fff', fontWeight: 'bold', marginTop: 10 },
  featureDesc: { color: '#555', fontSize: 12, marginTop: 5 }
});