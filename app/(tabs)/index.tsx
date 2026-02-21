import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans';
import { Rubik_400Regular, Rubik_700Bold } from '@expo-google-fonts/rubik';
import {
  RubikGlitch_400Regular,
  useFonts
} from '@expo-google-fonts/rubik-glitch';
import { RubikSprayPaint_400Regular } from '@expo-google-fonts/rubik-spray-paint';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function HomePage() {
  const router = useRouter();

  // Load all requested fonts
  let [fontsLoaded] = useFonts({
    'RubikGlitch': RubikGlitch_400Regular,
    'InstrumentSans': InstrumentSans_400Regular,
    'RubikSprayPaint': RubikSprayPaint_400Regular,
    'Rubik': Rubik_400Regular,
    'RubikBold': Rubik_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // Mock data for the chart
  const weeklyData = [0.8, 0.4, 0.3, 0.7, 0.4, 0.5, 0.2, 0.1, 0.2, 0.2, 0.1];
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SAT", "SUN"];

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Header Section */}
      <View style={styles.topInputContainer}>
        <TouchableOpacity style={styles.inputPill} activeOpacity={0.7}>
          <View style={styles.circleIcon} />
          <Text style={styles.inputText}>How much did you drink?</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        
        {/* Logo Section - Rubik Glitch */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>SIP</Text>
          <Text style={[styles.logoText, { marginLeft: 45, marginTop: -10 }]}>SAFE</Text>
        </View>

        {/* BAC Meter Section - Rubik Spray Paint */}
        <View style={styles.bacContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: '45%' }]} />
          </View>
          <Text style={styles.bacValueSpray}>0.04%</Text>
          <Text style={styles.bacLabelSpray}>EST. BAC</Text>
        </View>

        {/* Stats Grid - Rubik Spray Paint & Rubik */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statBox}>
            <Text style={styles.statTitleSpray}>Safe Streak</Text>
            <Text style={styles.statValueRubik}>14 DAYS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.statBox, { backgroundColor: '#222' }]}>
            <Text style={styles.statTitleSpray}>SOS</Text>
            <Text style={styles.statValueRubik}>Alert a friend</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Chart - Rubik Spray Paint */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitleSpray}>Weekly Consumption Chart</Text>
          <View style={styles.chartContainer}>
            {weeklyData.map((val, i) => (
              <View key={i} style={styles.barWrapper}>
                <View style={[styles.bar, { height: val * 80 }]} />
              </View>
            ))}
          </View>
          <View style={styles.chartLabels}>
            {days.map((day, i) => (
              <Text key={i} style={styles.dayLabel}>{day}</Text>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  
  // Header Style
  topInputContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  inputPill: {
    backgroundColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#8b5a2b',
  },
  circleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1d1d1',
    marginRight: 12,
  },
  inputText: { 
    color: '#fff', 
    fontSize: 16, 
    fontFamily: 'InstrumentSans' // Request 2: Instrument Sans
  },

  // Logo Style
  logoContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { 
    color: '#fff', 
    fontSize: 65, 
    fontFamily: 'RubikGlitch', // Request 1: Rubik Glitch
    lineHeight: 70,
  },

  // BAC Meter Style
  bacContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  progressBarBackground: {
    width: '100%',
    height: 14,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f58a4e', // Primary Brand Orange
  },
  bacValueSpray: { 
    color: '#fff', 
    fontSize: 60, 
    fontFamily: 'RubikSprayPaint', // Request 4: Rubik Spray Paint
    textAlign: 'center'
  },
  bacLabelSpray: { 
    color: '#fff', 
    fontSize: 20, 
    fontFamily: 'RubikSprayPaint', // Request 4: Rubik Spray Paint
    marginTop: -10
  },

  // Stats Grid Style
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  statBox: { 
    backgroundColor: '#111', 
    width: '48%', 
    padding: 18, 
    borderRadius: 20,
    height: 115,
    justifyContent: 'center'
  },
  statTitleSpray: { 
    color: '#fff', 
    fontSize: 20, 
    fontFamily: 'RubikSprayPaint', // Request 3: Rubik Spray Paint
    marginBottom: 8 
  },
  statValueRubik: { 
    color: '#999', 
    fontSize: 14, 
    fontFamily: 'Rubik' // Request 5: Rubik
  },

  // Chart Style
  chartCard: {
    backgroundColor: '#111',
    marginTop: 20,
    borderRadius: 25,
    padding: 20,
  },
  chartTitleSpray: { 
    color: '#fff', 
    fontSize: 18, 
    fontFamily: 'RubikSprayPaint', // Request 3: Rubik Spray Paint
    marginBottom: 20 
  },
  chartContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    justifyContent: 'space-between', 
    height: 80,
    marginBottom: 5
  },
  barWrapper: { width: 8 },
  bar: { 
    width: 8, 
    backgroundColor: '#f58a4e', 
    borderRadius: 2 
  },
  chartLabels: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10,
    paddingHorizontal: 2
  },
  dayLabel: { 
    color: '#444', 
    fontSize: 9, 
    fontWeight: 'bold' 
  }
});
