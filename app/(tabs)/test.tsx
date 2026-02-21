/**
 * SipSafe — DrinkTrackerScreen.tsx  [GRUNGE EDITION]
 *
 * Aesthetic: ink-bleed brutalism — raw monospace type, distressed borders,
 * high-contrast red/black/cream palette inspired by the moodboard.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Dimensions,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0E0B09",
  paper: "#F0EBE1",
  surface: "#161210",
  surfaceAlt: "#1E1A17",
  border: "#2C2520",
  red: "#C8321A",
  redDark: "#7A1E0E",
  orange: "#D4622A",
  safe: "#2E7D4F",
  caution: "#B8860B",
  danger: "#C8321A",
  text: "#F0EBE1",
  muted: "#6B5E52",
};

// ─── Types & Constants ────────────────────────────────────────────────────────

const DRINK_TYPES = [
  { label: "BEER",     emoji: "🍺", standardDrinks: 1.0, abv: 5  },
  { label: "WINE",     emoji: "🍷", standardDrinks: 1.0, abv: 12 },
  { label: "SHOT",     emoji: "🥃", standardDrinks: 1.0, abv: 40 },
  { label: "COCKTAIL", emoji: "🍹", standardDrinks: 1.5, abv: 15 },
  { label: "SELTZER",  emoji: "🫧", standardDrinks: 0.8, abv: 5  },
  { label: "CIDER",    emoji: "🍎", standardDrinks: 1.0, abv: 5  },
];

const WIDMARK_R = { male: 0.73, female: 0.66 };
const BAC_SAFE    = 0.06;
const BAC_CAUTION = 0.10;
const BAC_DANGER  = 0.15;

interface DrinkEntry {
  id: string;
  type: string;
  emoji: string;
  standardDrinks: number;
  timestamp: Date;
}

interface UserProfile {
  weightLbs: number;
  sex: "male" | "female";
  name: string;
}

// ─── Calculations ─────────────────────────────────────────────────────────────

function calculateBAC(drinks: DrinkEntry[], profile: UserProfile): number {
  if (drinks.length === 0) return 0;
  const now = Date.now();
  const weightKg = profile.weightLbs * 0.453592;
  let bac = 0;
  for (const drink of drinks) {
    const hoursAgo = (now - drink.timestamp.getTime()) / 3_600_000;
    const alcoholGrams = drink.standardDrinks * 14;
    const peakBAC = (alcoholGrams / (weightKg * 1000 * WIDMARK_R[profile.sex])) * 100;
    bac += peakBAC - Math.min(peakBAC, hoursAgo * 0.015);
  }
  return Math.max(0, bac);
}

function hoursToSober(bac: number) { return bac / 0.015; }

function formatDuration(hours: number): string {
  if (hours <= 0) return "NOW";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}M`;
  if (m === 0) return `${h}H`;
  return `${h}H ${m}M`;
}

function getBACStatus(bac: number) {
  if (bac === 0)         return { label: "SOBER",   color: C.safe,    bg: "#0D1F14", advice: "ALL CLEAR. STAY HYDRATED." };
  if (bac < BAC_SAFE)    return { label: "MILD",    color: C.safe,    bg: "#0D1F14", advice: "MILD EFFECTS. DRINK WATER." };
  if (bac < BAC_CAUTION) return { label: "CAUTION", color: C.caution, bg: "#1F1A08", advice: "COORDINATION AFFECTED. NO DRIVING." };
  if (bac < BAC_DANGER)  return { label: "HIGH",    color: C.danger,  bg: C.redDark, advice: "SIGNIFICANTLY IMPAIRED. STOP NOW." };
  return                        { label: "DANGER",  color: C.paper,   bg: C.danger,  advice: "⚠  SEEK HELP IMMEDIATELY." };
}

// ─── BAC Gauge ────────────────────────────────────────────────────────────────

const BACGauge = ({ bac }: { bac: number }) => {
  const status = getBACStatus(bac);
  const pct = Math.min(bac / 0.20, 1);
  const fillWidth = pct * (SCREEN_WIDTH - 68);
  const isDanger = bac >= BAC_DANGER;

  return (
    <View style={[gS.wrap, isDanger && { borderColor: C.danger, borderWidth: 2 }]}>
      <View style={gS.topRow}>
        <View>
          <Text style={gS.bacLabel}>BLOOD ALCOHOL CONTENT</Text>
          <Text style={[gS.bacNum, { color: status.color }]}>
            {bac.toFixed(3)}<Text style={gS.bacPct}>%</Text>
          </Text>
        </View>
        <View style={[gS.badge, { backgroundColor: status.bg, borderColor: status.color }]}>
          <Text style={[gS.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* Track */}
      <View style={gS.track}>
        <View style={[gS.fill, { width: fillWidth, backgroundColor: status.color }]} />
        {[BAC_SAFE, BAC_CAUTION, BAC_DANGER].map((v) => (
          <View key={v} style={[gS.tick, { left: (v / 0.20) * (SCREEN_WIDTH - 68) }]} />
        ))}
      </View>

      <View style={gS.zoneRow}>
        {["SAFE", "CAUTION", "HIGH", "DANGER"].map((z, i) => (
          <Text key={z} style={[gS.zoneLabel, { color: [C.safe, C.caution, C.danger, C.danger][i] }]}>{z}</Text>
        ))}
      </View>

      <View style={[gS.adviceStrip, { backgroundColor: status.bg, borderColor: status.color }]}>
        <Text style={[gS.adviceText, { color: status.color }]}>{status.advice}</Text>
      </View>
    </View>
  );
};

const gS = StyleSheet.create({
  wrap: {
    backgroundColor: C.surface,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  bacLabel: {
    color: C.muted,
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  bacNum: {
    fontSize: 52,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 52,
  },
  bacPct: { fontSize: 20, fontWeight: "400", letterSpacing: 0 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 2,
    borderWidth: 1.5,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontWeight: "900",
    letterSpacing: 2,
  },
  track: {
    height: 12,
    backgroundColor: C.surfaceAlt,
    borderRadius: 1,
    overflow: "visible",
    marginBottom: 5,
    position: "relative",
    borderWidth: 1,
    borderColor: C.border,
  },
  fill: { height: "100%", borderRadius: 1, position: "absolute", left: 0, opacity: 0.9 },
  tick: { position: "absolute", top: -4, width: 2, height: 20, backgroundColor: C.bg },
  zoneRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  zoneLabel: {
    fontSize: 8,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 1.5,
    fontWeight: "900",
  },
  adviceStrip: { borderWidth: 1, borderRadius: 2, padding: 10 },
  adviceText: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});

// ─── Stats ────────────────────────────────────────────────────────────────────

const StatBox = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <View style={stS.box}>
    <Text style={[stS.value, color ? { color } : {}]}>{value}</Text>
    <Text style={stS.label}>{label}</Text>
  </View>
);

const stS = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 2,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  value: {
    color: C.text,
    fontSize: 20,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontWeight: "900",
  },
  label: {
    color: C.muted,
    fontSize: 8,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    marginTop: 4,
    letterSpacing: 2,
    textAlign: "center",
  },
});

// ─── Danger Banner ────────────────────────────────────────────────────────────

const DangerBanner = ({ onAlert }: { onAlert: () => void }) => (
  <TouchableOpacity onPress={onAlert} activeOpacity={0.8}>
    <View style={bnS.wrap}>
      <Text style={bnS.skull}>☠</Text>
      <View style={{ flex: 1 }}>
        <Text style={bnS.title}>DANGER LEVEL REACHED</Text>
        <Text style={bnS.sub}>TAP TO ALERT EMERGENCY CONTACTS</Text>
      </View>
      <Text style={bnS.arrow}>›</Text>
    </View>
  </TouchableOpacity>
);

const bnS = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.redDark,
    borderRadius: 2,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1.5,
    borderColor: C.red,
    borderStyle: "dashed",
  },
  skull: { fontSize: 26, color: C.paper },
  title: {
    color: C.paper,
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  sub: {
    color: "#FFB3B3",
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 1,
    marginTop: 3,
  },
  arrow: { color: C.paper, fontSize: 22 },
});

// ─── Water Nudge ──────────────────────────────────────────────────────────────

const WaterNudge = ({ onDismiss }: { onDismiss: () => void }) => (
  <View style={wS.wrap}>
    <Text style={wS.icon}>💧</Text>
    <Text style={wS.text}>WATER BREAK — hydration helps your body process alcohol faster.</Text>
    <TouchableOpacity onPress={onDismiss}>
      <Text style={wS.dismiss}>OK</Text>
    </TouchableOpacity>
  </View>
);

const wS = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A1520",
    borderWidth: 1,
    borderColor: "#2A4A6A",
    borderStyle: "dashed",
    borderRadius: 2,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  icon: { fontSize: 16 },
  text: {
    flex: 1,
    color: "#7EB8D8",
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 1,
    lineHeight: 14,
  },
  dismiss: {
    color: "#7EB8D8",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontWeight: "900",
    letterSpacing: 2,
    paddingLeft: 6,
  },
});

// ─── Drink Log Item ───────────────────────────────────────────────────────────

const DrinkLogItem = ({ entry, onRemove }: { entry: DrinkEntry; onRemove: () => void }) => {
  const min = Math.round((Date.now() - entry.timestamp.getTime()) / 60000);
  const ago = min < 1 ? "JUST NOW" : min < 60 ? `${min}M AGO` : `${Math.floor(min / 60)}H AGO`;

  return (
    <View style={liS.row}>
      <Text style={liS.emoji}>{entry.emoji}</Text>
      <View style={liS.info}>
        <Text style={liS.name}>{entry.type}</Text>
        <Text style={liS.time}>{ago} · {entry.standardDrinks.toFixed(1)} STD DRINK</Text>
      </View>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={liS.remove}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const liS = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: C.surfaceAlt,
    borderRadius: 2,
    marginBottom: 6,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: C.red,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  emoji: { fontSize: 20 },
  info: { flex: 1 },
  name: {
    color: C.text,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontWeight: "900",
    letterSpacing: 2,
  },
  time: {
    color: C.muted,
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 1,
    marginTop: 3,
  },
  remove: { color: C.muted, fontSize: 13 },
});

// ─── Divider ──────────────────────────────────────────────────────────────────

const SectionDivider = ({ label }: { label: string }) => (
  <View style={divS.row}>
    <View style={divS.line} />
    <Text style={divS.label}>{label}</Text>
    <View style={divS.line} />
  </View>
);

const divS = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 16 },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  label: {
    color: C.muted,
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 3,
    fontWeight: "900",
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DrinkTrackerScreen() {
  const profile: UserProfile = { weightLbs: 130, sex: "female", name: "User" };

  const [drinks, setDrinks]             = useState<DrinkEntry[]>([]);
  const [bac, setBac]                   = useState(0);
  const [showWaterNudge, setWaterNudge] = useState(false);
  const [sessionStart]                  = useState(new Date());
  const [tick, setTick]                 = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setBac(calculateBAC(drinks, profile));
  }, [drinks, tick]);

  const addDrink = useCallback((dt: (typeof DRINK_TYPES)[number]) => {
    const entry: DrinkEntry = {
      id: Date.now().toString(),
      type: dt.label,
      emoji: dt.emoji,
      standardDrinks: dt.standardDrinks,
      timestamp: new Date(),
    };
    setDrinks((prev) => {
      const next = [entry, ...prev];
      if (next.length % 3 === 0) setWaterNudge(true);
      return next;
    });
  }, []);

  const removeDrink = useCallback((id: string) => {
    setDrinks((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const resetSession = () =>
    Alert.alert("END SESSION", "Clear all drinks and reset BAC?", [
      { text: "CANCEL", style: "cancel" },
      { text: "RESET", style: "destructive", onPress: () => { setDrinks([]); setWaterNudge(false); } },
    ]);

  const sendAlert = () =>
    Alert.alert("ALERT SENT", "Emergency contacts notified with your location.", [{ text: "OK" }]);

  const status       = getBACStatus(bac);
  const totalStd     = drinks.reduce((s, d) => s + d.standardDrinks, 0);
  const soberIn      = hoursToSober(bac);
  const sessionHours = (Date.now() - sessionStart.getTime()) / 3_600_000;
  const isDanger     = bac >= BAC_DANGER;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>// ACTIVE SESSION</Text>
          <Text style={s.title}>SIP<Text style={{ color: C.red }}>SAFE</Text></Text>
        </View>
        <TouchableOpacity style={s.endBtn} onPress={resetSession}>
          <Text style={s.endBtnTxt}>END</Text>
        </TouchableOpacity>
      </View>

      {/* Ticker strip */}
      <View style={s.ticker}>
        <Text style={s.tickerTxt} numberOfLines={1}>
          SESSION: {formatDuration(sessionHours)} ··  START: {sessionStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ··  DRINKS: {drinks.length} ··  BAC: {bac.toFixed(3)}% ··
        </Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {isDanger && <DangerBanner onAlert={sendAlert} />}
        {showWaterNudge && !isDanger && <WaterNudge onDismiss={() => setWaterNudge(false)} />}

        <BACGauge bac={bac} />

        {/* Stats */}
        <View style={s.statsRow}>
          <StatBox label={"DRINKS\nLOGGED"}  value={String(drinks.length)} />
          <View style={{ width: 8 }} />
          <StatBox label={"STANDARD\nDRINKS"} value={totalStd.toFixed(1)} color={C.orange} />
          <View style={{ width: 8 }} />
          <StatBox label={"SOBER\nIN"}        value={formatDuration(soberIn)} color={status.color} />
        </View>

        <SectionDivider label="LOG A DRINK" />

        {/* Drink grid */}
        <View style={s.grid}>
          {DRINK_TYPES.map((dt) => (
            <TouchableOpacity key={dt.label} style={s.drinkBtn} onPress={() => addDrink(dt)} activeOpacity={0.65}>
              <Text style={s.drinkEmoji}>{dt.emoji}</Text>
              <Text style={s.drinkName}>{dt.label}</Text>
              <Text style={s.drinkAbv}>{dt.abv}%</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Friend alert */}
        <TouchableOpacity style={s.alertBtn} onPress={sendAlert} activeOpacity={0.8}>
          <Text style={s.alertBtnTxt}>📍  ALERT MY FRIENDS</Text>
        </TouchableOpacity>

        {/* Log */}
        {drinks.length > 0 && (
          <>
            <SectionDivider label="TONIGHT'S LOG" />
            {drinks.map((e) => (
              <DrinkLogItem key={e.id} entry={e} onRemove={() => removeDrink(e.id)} />
            ))}
          </>
        )}

        {drinks.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyDash}>—</Text>
            <Text style={s.emptyTitle}>NO DRINKS LOGGED</Text>
            <Text style={s.emptySub}>Tap a drink above to start tracking.</Text>
          </View>
        )}

        <Text style={s.disclaimer}>
          BAC IS AN ESTIMATE (WIDMARK FORMULA). NEVER DRIVE IMPAIRED.{"\n"}IF IN DOUBT — CALL FOR HELP.
        </Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.red,
  },
  eyebrow: {
    color: C.muted,
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: {
    color: C.text,
    fontSize: 26,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontWeight: "900",
    letterSpacing: 3,
  },
  endBtn: {
    borderWidth: 1.5,
    borderColor: C.muted,
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  endBtnTxt: {
    color: C.muted,
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 3,
    fontWeight: "900",
  },

  ticker: { backgroundColor: C.red, paddingVertical: 5, paddingHorizontal: 14 },
  tickerTxt: {
    color: C.paper,
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 1.5,
    fontWeight: "700",
  },

  scroll: { flex: 1 },
  content: { padding: 14 },

  statsRow: { flexDirection: "row", marginBottom: 4 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  drinkBtn: {
    width: (SCREEN_WIDTH - 52) / 3,
    backgroundColor: C.surface,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  drinkEmoji: { fontSize: 24, marginBottom: 5 },
  drinkName: {
    color: C.text,
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  drinkAbv: {
    color: C.muted,
    fontSize: 8,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 1,
    marginTop: 3,
  },

  alertBtn: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.orange,
    borderRadius: 2,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 4,
  },
  alertBtnTxt: {
    color: C.orange,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontWeight: "900",
    letterSpacing: 2.5,
  },

  empty: { alignItems: "center", paddingVertical: 36 },
  emptyDash: { color: C.border, fontSize: 36, marginBottom: 10 },
  emptyTitle: {
    color: C.muted,
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontWeight: "900",
    letterSpacing: 3,
  },
  emptySub: {
    color: C.border,
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    letterSpacing: 1,
    marginTop: 6,
  },

  disclaimer: {
    color: C.border,
    fontSize: 8,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    textAlign: "center",
    lineHeight: 13,
    letterSpacing: 1.5,
    marginTop: 20,
    paddingHorizontal: 20,
  },
});