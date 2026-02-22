import { useDrinkContext } from '@/contexts/DrinkContext';
import { api } from '@/constants/api';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
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

const THEME_COLOR = '#FF4000';

const DRINK_TYPES = [
  { label: "BEER", emoji: "🍺", standardDrinks: 1.0 },
  { label: "WINE", emoji: "🍷", standardDrinks: 1.0 },
  { label: "SHOT", emoji: "🥃", standardDrinks: 1.0 },
  { label: "COCKTAIL", emoji: "🍹", standardDrinks: 1.5 },
  { label: "SELTZER", emoji: "🫧", standardDrinks: 0.8 },
  { label: "CIDER", emoji: "🍎", standardDrinks: 1.0 },
];

const CATEGORY_MAP: Record<string, string> = {
  BEER: 'beer', WINE: 'wine', SHOT: 'spirits', COCKTAIL: 'cocktail',
  SELTZER: 'cider', CIDER: 'cider',
};

function HomePageContent({ onOpenTracker }: { onOpenTracker: () => void }) {
  const router = useRouter();
  const { bac } = useDrinkContext();
  const bacPercentage = Math.min(((bac ?? 0) / 0.15) * 100, 100);

  return (
    <ImageBackground
      source={require('@/assets/images/sipsafe.jpg')}
      style={styles.fullScreenBg}
      resizeMode="cover"
    >
      {/* Dark overlay to make text readable over the photo */}
      <View style={styles.darkOverlay} />

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
        
        {/* 2. LOGO OVERLAY - Pushing content down */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo-sipsafe.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* 3. BAC DISPLAY - Now much lower */}
        <View style={styles.bacContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${bacPercentage}%` }]} />
          </View>
          <Text style={styles.bacValue}>{(bac ?? 0).toFixed(3)}%</Text>
          <Text style={styles.bacLabel}>EST. BAC</Text>
        </View>

        {/* 4. CARDS */}
        <View style={styles.actionButtonsWrapper}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.cardTitle}>Safe Streak</Text>
              <Text style={styles.cardValue}>14 DAYS</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: 'rgba(26,26,26,0.7)' }]}>
              <Text style={styles.cardTitle}>Alert</Text>
              <Text style={styles.cardValue}>Text a friend</Text>
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
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

export default function App() {
  const { addDrink: contextAddDrink } = useDrinkContext();
  const [fontsLoaded] = useFonts({
    BebasNeue: BebasNeue_400Regular,
    SpecialElite: SpecialElite_400Regular,
  });

  const [open, setOpen] = useState(false);
  const slideY = useRef(new Animated.Value(1000)).current;

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  useEffect(() => {
    Animated.spring(slideY, { toValue: open ? 0 : 1000, useNativeDriver: true, damping: 25 }).start();
  }, [open]);

  const addDrink = (dt: (typeof DRINK_TYPES)[number]) => {
    const entry = {
      id: Date.now().toString(),
      type: dt.label,
      emoji: dt.emoji,
      standardDrinks: dt.standardDrinks,
      timestamp: new Date(),
    };
    contextAddDrink(entry);
    setOpen(false);
    const category = CATEGORY_MAP[dt.label] ?? 'cocktail';
    const abv = dt.label === 'WINE' ? 12 : dt.label === 'SHOT' ? 40 : dt.label === 'COCKTAIL' ? 15 : 5;
    const volumeMl = Math.round((dt.standardDrinks * 14 * 100) / (0.789 * abv));
    api.logDrink({ drinkName: dt.label, category, abv, volumeMl }).catch(() => {});
  };

  if (!fontsLoaded) return null;

  return (
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
  );
}

const styles = StyleSheet.create({
  fullScreenBg: { flex: 1 },
  darkOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.65)' // Adjust this to make sipsafe.jpg more or less visible
  },
  nav: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    zIndex: 10 
  },
  inputPill: { 
    flex: 0.9, 
    backgroundColor: 'rgba(34,34,34,0.8)', 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 50, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)' 
  },
  circleIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#555', marginRight: 10 },
  inputPillText: { color: '#bbb', fontSize: 16, fontFamily: 'BebasNeue', letterSpacing: 1 },
  navBtn: { color: '#aaa', fontSize: 14, fontFamily: 'BebasNeue' },
  body: { paddingHorizontal: 20, paddingBottom: 120 },

  logoContainer: { 
    marginTop: 20,
    marginBottom: 100,
    marginVertical: 40, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: { 
    width: 240, 
    height: 110,
  },

  bacContainer: { 
      alignItems: 'center', 
      marginBottom: 40,
      paddingTop: 200,        // Extra internal spacing to sink the number lower
    },  
    progressBarBackground: { 
    width: '100%', 
    height: 12, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 6, 
    overflow: 'hidden', 
    marginBottom: 10 
  },
  progressBarFill: { height: '100%', backgroundColor: THEME_COLOR },
  bacValue: { 
    color: '#fff', 
    fontSize: 70, 
    fontFamily: 'BebasNeue', 
    letterSpacing: -2, 
    lineHeight: 80, 
    textShadowColor: 'rgba(255,64,0,0.8)', 
    textShadowOffset: { width: 0, height: 0 }, 
    textShadowRadius: 15 
  },
  bacLabel: { 
    color: '#fff', 
    fontSize: 22, 
    fontFamily: 'BebasNeue', 
    marginTop: -5, 
    opacity: 0.9, 
    letterSpacing: 6 
  },

  actionButtonsWrapper: { marginTop: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statCard: { 
    backgroundColor: 'rgba(20,20,20,0.75)', 
    width: '48%', 
    padding: 18, 
    borderRadius: 20, 
    height: 110, 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  cardTitle: { color: '#fff', fontSize: 24, fontFamily: 'BebasNeue', marginBottom: 2, letterSpacing: 1 },
  cardValue: { color: '#999', fontSize: 18, fontFamily: 'BebasNeue', letterSpacing: 1 },

  chartCard: { 
    backgroundColor: 'rgba(20,20,20,0.75)', 
    borderRadius: 25, 
    padding: 20, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, paddingHorizontal: 5 },
  chartColumn: { alignItems: 'center', flex: 1 },
  bar: { width: 14, backgroundColor: THEME_COLOR, borderRadius: 2 },

  receiptButton: {
    backgroundColor: 'rgba(20,20,20,0.8)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: THEME_COLOR,
  },
  receiptButtonText: { color: THEME_COLOR, fontSize: 22, fontFamily: 'BebasNeue', letterSpacing: 1 },
  receiptButtonArrow: { color: THEME_COLOR, fontSize: 24 },

  fab: { 
    position: 'absolute', 
    bottom: 30, 
    right: 20, 
    backgroundColor: THEME_COLOR, 
    paddingVertical: 10, 
    paddingHorizontal: 15, 
    borderRadius: 15, 
    alignItems: 'center', 
    elevation: 8,
    shadowColor: THEME_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5
  },
  fabText: { color: '#fff', fontSize: 10, fontFamily: 'BebasNeue' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' },
  modalSheet: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    backgroundColor: '#0E0B09', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    padding: 25, 
    borderTopWidth: 2, 
    borderTopColor: THEME_COLOR 
  },
  modalTitle: { color: '#fff', fontFamily: 'BebasNeue', fontSize: 24, marginBottom: 20, textAlign: 'center', letterSpacing: 1 },
  drinkGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  drinkBtn: { 
    width: '31%', 
    backgroundColor: '#161210', 
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#222' 
  },
  drinkBtnText: { color: '#fff', fontSize: 11, fontFamily: 'BebasNeue', marginTop: 8, letterSpacing: 1 },
});