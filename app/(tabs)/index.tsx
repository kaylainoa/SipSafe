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
import { BebasNeue_400Regular, useFonts } from '@expo-google-fonts/bebas-neue';
import { SpecialElite_400Regular } from '@expo-google-fonts/special-elite';

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
          
          <View style={styles.topSpacer} />
          
          <View style={styles.bacContainer}>
            <Text style={styles.bacValue}>0.000%</Text>
            <Text style={styles.bacLabel}>EST. BAC</Text>
          </View>

          <View style={styles.actionButtonsWrapper}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.cardTitle}>Safe Streak</Text>
                <Text style={styles.cardValue}>14 DAYS</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: 'rgba(26,26,26,0.85)' }]}>
                <Text style={styles.cardTitle}>Status</Text>
                <Text style={styles.cardValue}>Ready</Text>
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.cardTitle}>Weekly Consumption</Text>
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
    'BebasNeue': BebasNeue_400Regular,
    'SpecialElite': SpecialElite_400Regular,
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
  inputPillText: { color: '#999', fontSize: 16, fontFamily: 'BebasNeue', letterSpacing: 1 },
  body: { paddingHorizontal: 20, paddingBottom: 120 },
  
  topSpacer: { height: 420 },

  // Update these specific styles in your StyleSheet:

bacContainer: { 
  alignItems: 'center', 
  marginBottom: 50, // Slightly less margin for a tighter look
},

bacValue: { 
  color: '#fff', 
  fontSize: 80,      // Reduced from 120
  fontFamily: 'BebasNeue',
  letterSpacing: -2, // Less aggressive tracking for the smaller size
  lineHeight: 80,
  textShadowColor: 'rgba(212, 98, 42, 0.9)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 20, // Kept the bloom effect
},

bacLabel: { 
  color: '#fff', 
  fontSize: 18,      
  fontFamily: 'BebasNeue', 
  marginTop: -2,    // Tighter vertical lockup
  opacity: 0.5,     // Dropped opacity slightly for a more "ghosted" look
  letterSpacing: 6,  
},

  actionButtonsWrapper: { marginTop: 0 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statCard: { backgroundColor: 'rgba(17,17,17,0.85)', width: '48%', padding: 18, borderRadius: 20, height: 110, justifyContent: 'center' },
  cardTitle: { color: '#fff', fontSize: 24, fontFamily: 'BebasNeue', marginBottom: 2, letterSpacing: 1 },
  cardValue: { color: '#666', fontSize: 18, fontFamily: 'BebasNeue', letterSpacing: 1 },

  chartCard: { backgroundColor: 'rgba(17,17,17,0.85)', borderRadius: 25, padding: 20, marginBottom: 15 },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, paddingHorizontal: 5 },
  chartColumn: { alignItems: 'center', flex: 1 },
  bar: { width: 14, backgroundColor: '#D4622A', borderRadius: 2 }, 

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
  receiptButtonText: { color: '#D4622A', fontSize: 22, fontFamily: 'BebasNeue', letterSpacing: 1 },
  receiptButtonArrow: { color: '#D4622A', fontSize: 24 },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { backgroundColor: 'rgba(17,17,17,0.85)', width: '48%', padding: 15, borderRadius: 20, marginBottom: 15 },
  featureTitle: { color: '#fff', fontFamily: 'BebasNeue', fontSize: 18, marginTop: 5, letterSpacing: 1 },
  featureDesc: { color: '#555', fontSize: 14, marginTop: 2, fontFamily: 'BebasNeue', letterSpacing: 0.5 },
});