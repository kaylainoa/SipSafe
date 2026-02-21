import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import {
  ImageBackground,
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
  {title: "AI Scanner", desc: "Identify drinks", route: "/scanner" },
  {title: "Dashboard", desc: "Track trends", route: "/stats" },
  {title: "Alerts", desc: "Notify crew", route: "/alerts" },
  {title: "Voice AI", desc: "Safety guidance", route: "/voice" },
];

const BG_IMAGE = require('../../assets/images/sipsafe.jpg');

function HomePageContent() {
  const router = useRouter();

  return (
    <ImageBackground
      source={BG_IMAGE}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={styles.container}>
        <View style={styles.nav}>
          <View style={styles.inputPill}>
            <View style={styles.circleIcon} />
            <Text style={styles.inputPillText}>How much did you drink?</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          
          {/* TOP SPACER: This pushes everything down from the top nav */}
          <View style={styles.topSpacer} />
          
          {/* BAC Container - Shifted even lower */}
          <View style={styles.bacContainer}>
            <Text style={styles.bacValueSpray}>0.000%</Text>
            <Text style={styles.bacLabelSpray}>EST. BAC</Text>
          </View>

          {/* Action Buttons Wrapper */}
          <View style={styles.actionButtonsWrapper}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statTitleSpray}>Safe Streak</Text>
                <Text style={styles.statValueRubik}>14 DAYS</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: 'rgba(26,26,26,0.85)' }]}>
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
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>
      </View>
    </ImageBackground>
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
  bgImage: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  container: { flex: 1 },
  nav: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 60, alignItems: 'center', justifyContent: 'space-between' },
  inputPill: { flex: 1, backgroundColor: 'rgba(34,34,34,0.75)', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 50, borderWidth: 1, borderColor: '#444' },
  circleIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#555', marginRight: 10 },
  inputPillText: { color: '#999', fontSize: 14, fontFamily: 'InstrumentSans' },
  body: { paddingHorizontal: 20, paddingBottom: 120 },
  
  // MASSIVE SPACER: Set to 320 to push everything down significantly
  topSpacer: {
    height: 320, 
  },

  bacContainer: { 
    alignItems: 'center', 
    marginBottom: 40 // Tighter spacing to keep action items visible
  },
  
  bacValueSpray: { 
    color: '#fff', 
    fontSize: 72, // Mega size for the hero element
    fontFamily: 'RubikSprayPaint',
    // Added a subtle glow since it's now the centerpiece
    textShadowColor: 'rgba(212, 98, 42, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  
  bacLabelSpray: { 
    color: '#fff', 
    fontSize: 20, 
    fontFamily: 'RubikSprayPaint', 
    marginTop: -10,
    opacity: 0.6,
    letterSpacing: 2
  },

  actionButtonsWrapper: {
    marginTop: 0, 
  },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statCard: { backgroundColor: 'rgba(17,17,17,0.85)', width: '48%', padding: 18, borderRadius: 20, height: 110, justifyContent: 'center' },
  statTitleSpray: { color: '#fff', fontSize: 18, fontFamily: 'RubikSprayPaint', marginBottom: 5 },
  statValueRubik: { color: '#666', fontSize: 14, fontFamily: 'Rubik' },
  chartCard: { backgroundColor: 'rgba(17,17,17,0.85)', borderRadius: 25, padding: 20, marginBottom: 15 },
  chartTitleSpray: { color: '#fff', fontSize: 18, fontFamily: 'RubikSprayPaint', marginBottom: 20 },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, paddingHorizontal: 5 },
  chartColumn: { alignItems: 'center', flex: 1 },
  bar: { width: 12, backgroundColor: '#D4622A', borderRadius: 4 }, // Updated to SipSafe Orange
  receiptButton: {
    backgroundColor: 'rgba(17,17,17,0.85)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  receiptButtonText: { color: '#D4622A', fontSize: 18, fontFamily: 'RubikSprayPaint' },
  receiptButtonArrow: { color: '#D4622A', fontSize: 22, fontWeight: 'bold' },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { backgroundColor: 'rgba(17,17,17,0.85)', width: '48%', padding: 15, borderRadius: 20, marginBottom: 15 },
  featureTitle: { color: '#fff', fontFamily: 'RubikBold', fontSize: 14, marginTop: 10 },
  featureDesc: { color: '#555', fontSize: 11, marginTop: 4, fontFamily: 'InstrumentSans' },
});