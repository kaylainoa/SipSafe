import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Fonts
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans';
import { Rubik_400Regular, Rubik_700Bold } from '@expo-google-fonts/rubik';
import { RubikGlitch_400Regular, useFonts } from '@expo-google-fonts/rubik-glitch';
import { RubikSprayPaint_400Regular } from '@expo-google-fonts/rubik-spray-paint';

const FEATURES = [
  { icon: "🍹", title: "AI Scanner", desc: "Identify drinks", route: "/scanner" },
  { icon: "📊", title: "Dashboard", desc: "Track trends", route: "/stats" },
  { icon: "🔔", title: "Alerts", desc: "Notify crew", route: "/alerts" },
  { icon: "🎙️", title: "Voice AI", desc: "Safety guidance", route: "/voice" },
];

function HomePageContent() {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <View style={styles.inputPill}>
          <View style={styles.circleIcon} />
          <Text style={styles.inputPillText}>How much did you drink?</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Text style={styles.navBtn}>Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoTextGlitch}>SIP</Text>
          <Text style={[styles.logoTextGlitch, { marginLeft: 45, marginTop: -15 }]}>SAFE</Text>
        </View>

        <View style={styles.bacContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `0%` }]} />
          </View>
          <Text style={styles.bacValueSpray}>0.000%</Text>
          <Text style={styles.bacLabelSpray}>EST. BAC</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statTitleSpray}>Safe Streak</Text>
            <Text style={styles.statValueRubik}>14 DAYS</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#1a1a1a' }]}>
            <Text style={styles.statTitleSpray}>Status</Text>
            <Text style={styles.statValueRubik}>Ready</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitleSpray}>Weekly Consumption</Text>
          <View style={styles.chartContainer}>
            {[0.4, 0.7, 0.3, 0.8, 0.5, 0.9, 0.2].map((val, i) => (
              <View key={`col-${i}`} style={styles.chartColumn}>
                <View style={[styles.bar, { height: val * 80 }]} />
              </View>
            ))}
          </View>
        </View>

        {/* --- NEW RECEIPT BUTTON --- */}
        <TouchableOpacity 
          style={styles.receiptButton} 
          onPress={() => router.push("/receipt")}
          activeOpacity={0.8}
        >
          <Text style={styles.receiptButtonText}>VIEW NIGHT'S RECEIPT</Text>
          <Text style={styles.receiptButtonArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.featureGrid}>
          {FEATURES.map((f) => (
            <TouchableOpacity 
              key={f.title} 
              style={styles.featureCard}
              onPress={() => router.push(f.route as any)}
            >
              <Text style={{ fontSize: 24 }}>{f.icon}</Text>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'RubikGlitch': RubikGlitch_400Regular,
    'InstrumentSans': InstrumentSans_400Regular,
    'RubikSprayPaint': RubikSprayPaint_400Regular,
    'Rubik': Rubik_400Regular,
    'RubikBold': Rubik_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" />
      <HomePageContent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  nav: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 60, alignItems: 'center', justifyContent: 'space-between' },
  inputPill: { flex: 0.9, backgroundColor: '#222', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 50, borderWidth: 1, borderColor: '#444' },
  circleIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#555', marginRight: 10 },
  inputPillText: { color: '#999', fontSize: 14, fontFamily: 'InstrumentSans' },
  navBtn: { color: '#666', fontSize: 14, fontFamily: 'RubikBold' },
  body: { paddingHorizontal: 20, paddingBottom: 120 },
  logoContainer: { marginVertical: 30, alignItems: 'center' },
  logoTextGlitch: { color: '#fff', fontSize: 70, fontFamily: 'RubikGlitch', lineHeight: 75 },
  bacContainer: { alignItems: 'center', marginBottom: 25 },
  progressBarBackground: { width: '100%', height: 12, backgroundColor: '#222', borderRadius: 6, overflow: 'hidden', marginBottom: 10 },
  progressBarFill: { height: '100%', backgroundColor: '#f58a4e' },
  bacValueSpray: { color: '#fff', fontSize: 65, fontFamily: 'RubikSprayPaint' },
  bacLabelSpray: { color: '#fff', fontSize: 22, fontFamily: 'RubikSprayPaint', marginTop: -10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { backgroundColor: '#111', width: '48%', padding: 18, borderRadius: 20, height: 110, justifyContent: 'center' },
  statTitleSpray: { color: '#fff', fontSize: 18, fontFamily: 'RubikSprayPaint', marginBottom: 5 },
  statValueRubik: { color: '#666', fontSize: 14, fontFamily: 'Rubik' },
  chartCard: { backgroundColor: '#111', borderRadius: 25, padding: 20, marginBottom: 15 },
  chartTitleSpray: { color: '#fff', fontSize: 18, fontFamily: 'RubikSprayPaint', marginBottom: 20 },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, paddingHorizontal: 5 },
  chartColumn: { alignItems: 'center', flex: 1 },
  bar: { width: 12, backgroundColor: '#f58a4e', borderRadius: 4 },
  
  // --- NEW STYLES ---
  receiptButton: {
    backgroundColor: '#111',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333'
  },
  receiptButtonText: {
    color: '#f58a4e', // Matches your orange theme
    fontSize: 18,
    fontFamily: 'RubikSprayPaint',
  },
  receiptButtonArrow: {
    color: '#f58a4e',
    fontSize: 22,
    fontWeight: 'bold',
  },
  // --- END NEW STYLES ---

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { backgroundColor: '#111', width: '48%', padding: 15, borderRadius: 20, marginBottom: 15 },
  featureTitle: { color: '#fff', fontFamily: 'RubikBold', fontSize: 14, marginTop: 10 },
  featureDesc: { color: '#555', fontSize: 11, marginTop: 4, fontFamily: 'InstrumentSans' },
});