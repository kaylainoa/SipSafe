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
import { BebasNeue_400Regular, useFonts } from '@expo-google-fonts/bebas-neue';
import { SpecialElite_400Regular } from '@expo-google-fonts/special-elite';

const FEATURES = [
  { title: "AI Scanner", desc: "Identify drinks", route: "/scanner" },
  { title: "Dashboard", desc: "Track trends", route: "/stats" },
  { title: "Alerts", desc: "Notify crew", route: "/alerts" },
  { title: "Voice AI", desc: "Safety guidance", route: "/voice" },
];

const DRINK_TYPES = [
  { label: "BEER", emoji: "🍺", standardDrinks: 1.0 },
  { label: "WINE", emoji: "🍷", standardDrinks: 1.0 },
  { label: "SHOT", emoji: "🥃", standardDrinks: 1.0 },
  { label: "COCKTAIL", emoji: "🍹", standardDrinks: 1.5 },
  { label: "SELTZER", emoji: "🫧", standardDrinks: 0.8 },
  { label: "CIDER", emoji: "🍎", standardDrinks: 1.0 },
];

const WIDMARK_R = { male: 0.73, female: 0.66 };
const USER_WEIGHT_LBS = 130;
const USER_SEX = "female";

interface DrinkEntry {
  id: string;
  type: string;
  emoji: string;
  standardDrinks: number;
  timestamp: Date;
}

const DrinkContext = createContext({
  bac: 0,
  drinks: [] as DrinkEntry[],
  addDrink: (_dt: (typeof DRINK_TYPES)[number]) => {},
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
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo-sipsafe.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.bacContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${bacPercentage}%` }]} />
          </View>
          <Text style={styles.bacValue}>{bac.toFixed(3)}%</Text>
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
              <Text style={styles.cardValue}>{drinks.length} Drinks</Text>
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
    </ImageBackground>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    BebasNeue: BebasNeue_400Regular,
    SpecialElite: SpecialElite_400Regular,
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

  const addDrink = (dt: (typeof DRINK_TYPES)[number]) => {
    const entry = { id: Date.now().toString(), ...dt, timestamp: new Date() } as DrinkEntry;
    setDrinks((prev) => [entry, ...prev]);
    setOpen(false);
  };

  if (!fontsLoaded) return null;

  return (
    <DrinkContext.Provider value={{ bac, drinks, addDrink }}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" />
        <HomePageContent onOpenTracker={() => setOpen(true)} />

        <TouchableOpacity style={styles.fab} onPress={() => setOpen(true)}>
          <Text style={{ fontSize: 24 }}>🍺</Text>
          <Text style={styles.fabText}>TRACK</Text>
        </TouchableOpacity>

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
  inputPillText: { color: '#999', fontSize: 16, fontFamily: 'BebasNeue', letterSpacing: 1 },
  navBtn: { color: '#666', fontSize: 14, fontFamily: 'BebasNeue' },
  body: { paddingHorizontal: 20, paddingBottom: 120 },

  logoContainer: { marginVertical: 24, alignItems: 'center' },
  logoImage: { width: 220, height: 100 },

  bacContainer: { alignItems: 'center', marginBottom: 25 },
  progressBarBackground: { width: '100%', height: 12, backgroundColor: '#222', borderRadius: 6, overflow: 'hidden', marginBottom: 10 },
  progressBarFill: { height: '100%', backgroundColor: '#f58a4e' },
  bacValue: { color: '#fff', fontSize: 65, fontFamily: 'BebasNeue', letterSpacing: -2, lineHeight: 80, textShadowColor: 'rgba(212,98,42,0.9)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  bacLabel: { color: '#fff', fontSize: 22, fontFamily: 'BebasNeue', marginTop: -10, opacity: 0.8, letterSpacing: 6 },

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
    borderColor: '#333',
  },
  receiptButtonText: { color: '#D4622A', fontSize: 22, fontFamily: 'BebasNeue', letterSpacing: 1 },
  receiptButtonArrow: { color: '#D4622A', fontSize: 24 },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { backgroundColor: 'rgba(17,17,17,0.85)', width: '48%', padding: 15, borderRadius: 20, marginBottom: 15 },
  featureTitle: { color: '#fff', fontFamily: 'BebasNeue', fontSize: 18, marginTop: 5, letterSpacing: 1 },
  featureDesc: { color: '#555', fontSize: 14, marginTop: 2, fontFamily: 'BebasNeue', letterSpacing: 0.5 },

  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#C8321A', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 15, alignItems: 'center', elevation: 5 },
  fabText: { color: '#fff', fontSize: 10, fontFamily: 'BebasNeue' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' },
  modalSheet: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#0E0B09', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, borderTopWidth: 2, borderTopColor: '#C8321A' },
  modalTitle: { color: '#fff', fontFamily: 'BebasNeue', fontSize: 24, marginBottom: 20, textAlign: 'center', letterSpacing: 1 },
  drinkGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  drinkBtn: { width: '31%', backgroundColor: '#161210', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  drinkBtnText: { color: '#fff', fontSize: 11, fontFamily: 'BebasNeue', marginTop: 8, letterSpacing: 1 },
});
