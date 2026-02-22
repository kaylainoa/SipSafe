import { api } from '@/constants/api';
import { useDrinkContext } from '@/contexts/DrinkContext';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
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

const THEME_COLOR = '#FF4000';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function HomePageContent() {
  const router = useRouter();
  const { bac } = useDrinkContext();
  const [weeklyCounts, setWeeklyCounts] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  const loadWeekly = useCallback(async () => {
    try {
      const res = await api.getConsumptionAnalytics('1w');
      const buckets = (res as { buckets?: { count: number }[] })?.buckets;
      if (Array.isArray(buckets) && buckets.length >= 7) {
        setWeeklyCounts(buckets.slice(0, 7).map((b) => b.count));
        return;
      }
      if (Array.isArray(buckets) && buckets.length > 0) {
        const counts = [...buckets.map((b) => b.count)];
        while (counts.length < 7) counts.unshift(0);
        setWeeklyCounts(counts.slice(0, 7));
        return;
      }
    } catch {
      // fallback: use getLogs and bucket last 7 days
    }
    try {
      const logs = (await api.getLogs({ limit: 100 })) as { createdAt: string }[];
      const list = Array.isArray(logs) ? logs : [];
      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;
      const counts = [0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(now);
        dayStart.setDate(dayStart.getDate() - (6 - i));
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart.getTime() + dayMs);
        const n = list.filter((l) => {
          const t = new Date(l.createdAt).getTime();
          return t >= dayStart.getTime() && t < dayEnd.getTime();
        }).length;
        counts[i] = n;
      }
      setWeeklyCounts(counts);
    } catch {
      setWeeklyCounts([0, 0, 0, 0, 0, 0, 0]);
    }
  }, []);

  useEffect(() => {
    loadWeekly();
  }, [loadWeekly]);

  const maxWeekly = Math.max(1, ...weeklyCounts);
  const barHeight = (count: number) => Math.max(2, (count / maxWeekly) * 80);

  return (
    <ImageBackground
      source={require('@/assets/images/sipsafe.jpg')}
      style={styles.fullScreenBg}
      resizeMode="cover"
    >
      {/* Dark overlay to make text readable over the photo */}
      <View style={styles.darkOverlay} />

      {/* Top nav - Profile only */}
      <View style={styles.nav}>
        <View style={styles.navSpacer} />
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Text style={styles.navBtn}>Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo-sipsafe.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* BAC display - no progress bar */}
        <View style={styles.bacContainer}>
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

          <TouchableOpacity
            style={styles.chartCard}
            onPress={() => router.push("/stats")}
            activeOpacity={0.85}
          >
            <Text style={styles.cardTitle}>Weekly Consumption</Text>
            <View style={styles.chartContainer}>
              {weeklyCounts.map((count, i) => (
                <View key={`col-${i}`} style={styles.chartColumn}>
                  <View style={[styles.bar, { height: barHeight(count) }]} />
                  <Text style={styles.barDayLabel}>{DAY_LABELS[i]}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.chartCardHint}>Tap to view full stats →</Text>
          </TouchableOpacity>

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
  const [fontsLoaded] = useFonts({
    BebasNeue: BebasNeue_400Regular,
    SpecialElite: SpecialElite_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
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
    justifyContent: 'flex-end', 
    zIndex: 10 
  },
  navSpacer: { flex: 1 },
  navBtn: { color: '#aaa', fontSize: 20, fontFamily: 'BebasNeue' },
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
    paddingTop: 200,
  },
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
    borderRadius: 0, 
    height: 110, 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  cardTitle: { color: '#fff', fontSize: 24, fontFamily: 'BebasNeue', marginBottom: 2, letterSpacing: 1 },
  cardValue: { color: '#999', fontSize: 18, fontFamily: 'BebasNeue', letterSpacing: 1 },

  chartCard: { 
    backgroundColor: 'rgba(20,20,20,0.75)', 
    borderRadius: 0, 
    padding: 20, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, paddingHorizontal: 5 },
  chartColumn: { alignItems: 'center', flex: 1 },
  bar: { width: 14, backgroundColor: THEME_COLOR, borderRadius: 2 },
  barDayLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4 },
  chartCardHint: { color: THEME_COLOR, fontSize: 12, marginTop: 10, opacity: 0.9 },

  receiptButton: {
    backgroundColor: 'rgba(20,20,20,0.8)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 0,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: THEME_COLOR,
  },
  receiptButtonText: { color: THEME_COLOR, fontSize: 22, fontFamily: 'BebasNeue', letterSpacing: 1 },
  receiptButtonArrow: { color: THEME_COLOR, fontSize: 24 },
});