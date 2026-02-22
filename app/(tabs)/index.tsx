import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Modal,
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

// --- CONSTANTS & LOGIC ---
const WIDMARK_R = { male: 0.73, female: 0.66 };
const USER_WEIGHT_LBS = 130;
const USER_SEX = "female";

const DRINK_TYPES = [
  { label: "BEER", emoji: "🍺", standardDrinks: 1.0 },
  { label: "WINE", emoji: "🍷", standardDrinks: 1.0 },
  { label: "SHOT", emoji: "🥃", standardDrinks: 1.0 },
  { label: "COCKTAIL", emoji: "🍹", standardDrinks: 1.5 },
  { label: "SELTZER", emoji: "🫧", standardDrinks: 0.8 },
  { label: "CIDER", emoji: "🍎", standardDrinks: 1.0 },
];

const FEATURES = [
  { icon: "🍹", title: "AI Scanner", desc: "Identify drinks" },
  { icon: "📊", title: "Dashboard", desc: "Track trends" },
  { icon: "🔔", title: "Alerts", desc: "Notify crew" },
  { icon: "🎙️", title: "Voice AI", desc: "Safety guidance" },
];

interface DrinkEntry {
  id: string; type: string; emoji: string;
  standardDrinks: number; timestamp: Date;
}

const DrinkContext = createContext({
  bac: 0,
  drinks: [] as DrinkEntry[],
  addDrink: (dt: any) => {},
});

function calcBAC(drinks: DrinkEntry[]): number {
  if (!drinks.length) return 0;
  const wKg = USER_WEIGHT_LBS * 0.453592;
  let totalBac = 0;
  for (const d of drinks) {
    const hrs = (Date.now() - d.timestamp.getTime()) / 3600000;
    const peak = (d.standardDrinks * 14) / (wKg * 1000 * WIDMARK_R[USER_SEX]) * 100;
    totalBac += peak - Math.min(peak, hrs * 0.015);
  }
  return Math.max(0, totalBac);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── HOME PAGE CONTENT ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function HomePageContent({ onOpenTracker }: { onOpenTracker: () => void }) {
  const router = useRouter();
  const { bac, drinks } = useContext(DrinkContext);
  const bacPercentage = Math.min((bac / 0.15) * 100, 100);

  return (
    <ImageBackground
      source={require('@/assets/images/background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* 1. TOP NAV PILL */}
      <View style={styles.nav}>
        <TouchableOpacity style={styles.inputPill} onPress={onOpenTracker}>
          <View style={styles.circleIcon} />
          <Text style={styles.inputPillText}>How much did you drink?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Text style={styles.navBtn}>Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* 2. SIPSAFE LOGO (above BAC) */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo-sipsafe.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* 3. DYNAMIC BAC DISPLAY */}
        <View style={styles.bacContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${bacPercentage}%` }]} />
          </View>
          <Text style={styles.bacValueSpray}>{bac.toFixed(3)}%</Text>
          <Text style={styles.bacLabelSpray}>EST. BAC</Text>
        </View>

        {/* 4. STATS GRID */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statTitleSpray}>Safe Streak</Text>
            <Text style={styles.statValueRubik}>14 DAYS</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#1a1a1a' }]}>
            <Text style={styles.statTitleSpray}>Logged</Text>
            <Text style={styles.statValueRubik}>{drinks.length} Drinks</Text>
          </View>
        </View>

        {/* 5. WEEKLY CONSUMPTION CHART */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitleSpray}>Weekly Consumption</Text>
          <View style={styles.chartContainer}>
            {[0.4, 0.7, 0.3, 0.8, 0.5, 0.9, 0.2].map((val, i) => (
              <View key={`col-${i}`} style={styles.chartColumn}>
                <View style={[styles.bar, { height: val * 80 }]} />
              </View>
            ))}
          </View>
          <View style={styles.labelRow}>
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
              <Text key={day} style={styles.dayLabel}>{day}</Text>
            ))}
          </View>
        </View>

        {/* 6. FEATURE GRID */}
        <View style={styles.featureGrid}>
          {FEATURES.map((f) => (
            <TouchableOpacity key={f.title} style={styles.featureCard}>
              <Text style={{ fontSize: 24 }}>{f.icon}</Text>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── ROOT APP / PROVIDER ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [fontsLoaded] = useFonts({
    'RubikGlitch': RubikGlitch_400Regular,
    'InstrumentSans': InstrumentSans_400Regular,
    'RubikSprayPaint': RubikSprayPaint_400Regular,
    'Rubik': Rubik_400Regular,
    'RubikBold': Rubik_700Bold,
  });

  const [open, setOpen] = useState(false);
  const [drinks, setDrinks] = useState<DrinkEntry[]>([]);
  const [bac, setBac] = useState(0);
  const slideY = useRef(new Animated.Value(1000)).current;

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    setBac(calcBAC(drinks));
    const timer = setInterval(() => setBac(calcBAC(drinks)), 30000);
    return () => clearInterval(timer);
  }, [drinks]);

  useEffect(() => {
    Animated.spring(slideY, { toValue: open ? 0 : 1000, useNativeDriver: true, damping: 25 }).start();
  }, [open]);

  const addDrink = (dt: any) => {
    const entry = { id: Date.now().toString(), ...dt, timestamp: new Date() };
    setDrinks([entry, ...drinks]);
    setOpen(false);
  };

  if (!fontsLoaded) return null;

  return (
    <DrinkContext.Provider value={{ bac, drinks, addDrink }}>
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <HomePageContent onOpenTracker={() => setOpen(true)} />

        {/* FLOATING ACTION BUTTON */}
        <TouchableOpacity style={styles.fab} onPress={() => setOpen(true)}>
          <Text style={{ fontSize: 24 }}>🍺</Text>
          <Text style={styles.fabText}>TRACK</Text>
        </TouchableOpacity>

        {/* DRINK MODAL */}
        <Modal visible={open} transparent animationType="none">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setOpen(false)} />
          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideY }] }]}>
            <Text style={styles.modalTitle}>LOG A DRINK</Text>
            <View style={styles.drinkGrid}>
              {DRINK_TYPES.map((dt) => (
                <TouchableOpacity key={dt.label} style={styles.drinkBtn} onPress={() => addDrink(dt)}>
                  <Text style={{ fontSize: 30 }}>{dt.emoji}</Text>
                  <Text style={styles.drinkBtnText}>{dt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </Modal>
      </View>
    </DrinkContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  nav: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 60, alignItems: 'center', justifyContent: 'space-between' },
  inputPill: { flex: 0.9, backgroundColor: 'rgba(34,34,34,0.9)', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 50, borderWidth: 1, borderColor: '#444' },
  circleIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#555', marginRight: 10 },
  inputPillText: { color: '#999', fontSize: 14, fontFamily: 'InstrumentSans' },
  navBtn: { color: '#666', fontSize: 14, fontFamily: 'RubikBold' },
  body: { paddingHorizontal: 20, paddingBottom: 120 },

  logoContainer: { marginVertical: 24, alignItems: 'center' },
  logoImage: { width: 220, height: 100 },

  bacContainer: { alignItems: 'center', marginBottom: 25 },
  progressBarBackground: { width: '100%', height: 12, backgroundColor: '#222', borderRadius: 6, overflow: 'hidden', marginBottom: 10 },
  progressBarFill: { height: '100%', backgroundColor: '#f58a4e' },
  bacValueSpray: { color: '#fff', fontSize: 65, fontFamily: 'RubikSprayPaint' },
  bacLabelSpray: { color: '#fff', fontSize: 22, fontFamily: 'RubikSprayPaint', marginTop: -10 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { backgroundColor: '#111', width: '48%', padding: 18, borderRadius: 20, height: 110, justifyContent: 'center' },
  statTitleSpray: { color: '#fff', fontSize: 18, fontFamily: 'RubikSprayPaint', marginBottom: 5 },
  statValueRubik: { color: '#666', fontSize: 14, fontFamily: 'Rubik' },

  chartCard: { backgroundColor: '#111', borderRadius: 25, padding: 20, marginBottom: 20 },
  chartTitleSpray: { color: '#fff', fontSize: 18, fontFamily: 'RubikSprayPaint', marginBottom: 20 },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, paddingHorizontal: 5 },
  chartColumn: { alignItems: 'center', flex: 1 },
  bar: { width: 12, backgroundColor: '#f58a4e', borderRadius: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 5 },
  dayLabel: { color: '#444', fontSize: 9, fontFamily: 'RubikBold', flex: 1, textAlign: 'center' },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { backgroundColor: '#111', width: '48%', padding: 15, borderRadius: 20, marginBottom: 15 },
  featureTitle: { color: '#fff', fontFamily: 'RubikBold', fontSize: 14, marginTop: 10 },
  featureDesc: { color: '#555', fontSize: 11, marginTop: 4, fontFamily: 'InstrumentSans' },

  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#C8321A', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 15, alignItems: 'center', elevation: 5 },
  fabText: { color: '#fff', fontSize: 10, fontFamily: 'RubikBold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' },
  modalSheet: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#0E0B09', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, borderTopWidth: 2, borderTopColor: '#C8321A' },
  modalTitle: { color: '#fff', fontFamily: 'RubikSprayPaint', fontSize: 24, marginBottom: 20, textAlign: 'center' },
  drinkGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  drinkBtn: { width: '31%', backgroundColor: '#161210', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  drinkBtnText: { color: '#fff', fontSize: 11, fontFamily: 'RubikBold', marginTop: 8 }
});