/**
 * SipSafe — DrinkTrackerFAB.tsx
 *
 * A self-contained floating action button + bottom-sheet modal that sits
 * ABOVE the navigator so it persists on every screen.
 *
 * ── HOW TO USE ──────────────────────────────────────────────────────────────
 *
 *   // App.tsx  (or app/_layout.tsx for Expo Router)
 *   import DrinkTrackerFAB from './components/DrinkTrackerFAB';
 *
 *   export default function App() {
 *     return (
 *       <DrinkTrackerFAB>
 *         <NavigationContainer>
 *           <Tab.Navigator>...</Tab.Navigator>
 *         </NavigationContainer>
 *       </DrinkTrackerFAB>
 *     );
 *   }
 *
 *   // — OR — for Expo Router (app/_layout.tsx):
 *   export default function RootLayout() {
 *     return (
 *       <DrinkTrackerFAB>
 *         <Stack />
 *       </DrinkTrackerFAB>
 *     );
 *   }
 *
 * The FAB floats over EVERY screen. Remove DrinkTrackerScreen from your tabs.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { analyzeDrinkForSpoofing } from "@/lib/drinkSpoofingDetection";
import { speakText } from "@/lib/elevenlabsTTS";
import { verifyDrinkWithGemini } from "@/lib/geminiDrinkVerification";
import { api } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Linking,
    Modal,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
 
} from "react-native";

const { width: SW } = Dimensions.get("window");

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0E0B09",
  paper: "#F0EBE1",
  surface: "#161210",
  surfaceAlt: "#1E1A17",
  border: "#2C2520",
  red: "#ff4000",
  redDark: "#7A1E0E",
  orange: "#ff4000",
  orangeLight: "#FF8C42", // Added for rim-light effect
  safe: "#2E7D4F",
  caution: "#B8860B",
  text: "#F0EBE1",
  muted: "#6B5E52",
};
const MONO = "BebasNeue";

// ─── Drink types (static + from API) ──────────────────────────────────────────
type DrinkOption = {
  id?: string;
  label: string;
  emoji: string;
  standardDrinks: number;
  abv: number;
};

const DRINK_TYPES: DrinkOption[] = [
  { label: "BEER", emoji: "🍺", standardDrinks: 1.0, abv: 5 },
  { label: "WINE", emoji: "🍷", standardDrinks: 1.0, abv: 12 },
  { label: "SHOT", emoji: "🥃", standardDrinks: 1.0, abv: 40 },
  { label: "COCKTAIL", emoji: "🍹", standardDrinks: 1.5, abv: 15 },
  { label: "SELTZER", emoji: "🫧", standardDrinks: 0.8, abv: 5 },
  { label: "CIDER", emoji: "🍎", standardDrinks: 1.0, abv: 5 },
];

const CATEGORY_EMOJI: Record<string, string> = {
  beer: "🍺",
  wine: "🍷",
  spirits: "🥃",
  cocktail: "🍹",
  cider: "🍎",
  "non-alcoholic": "🫧",
};

// ─── Types & BAC logic ────────────────────────────────────────────────────────
interface DrinkEntry {
  id: string;
  type: string;
  emoji: string;
  standardDrinks: number;
  bacAtLog: number;
  timestamp: Date;
}

const WIDMARK_R = { male: 0.73, female: 0.66 };
const BAC_SAFE = 0.06;
const BAC_CAUTION = 0.1;
const BAC_DANGER = 0.15;

const DEFAULT_WEIGHT_LBS = 130;
const DEFAULT_GENDER: "male" | "female" = "female";

type BACProfile = { weightLbs: number; gender: "male" | "female" };

function calcBAC(drinks: DrinkEntry[], profile: BACProfile): number {
  if (!drinks.length) return 0;
  const wKg = profile.weightLbs * 0.453592;
  const r = WIDMARK_R[profile.gender];
  let bac = 0;
  for (const d of drinks) {
    const hrs = (Date.now() - d.timestamp.getTime()) / 3_600_000;
    const peak = ((d.standardDrinks * 14) / (wKg * 1000 * r)) * 100;
    bac += peak - Math.min(peak, hrs * 0.015);
  }
  return Math.max(0, bac);
}

function labelToCategory(label: string): string {
  const l = label.toUpperCase();
  if (l === "BEER") return "beer";
  if (l === "WINE") return "wine";
  if (l === "SHOT") return "spirits";
  if (l === "COCKTAIL") return "cocktail";
  if (l === "SELTZER" || l === "CIDER") return "cider";
  return "cocktail";
}

function volumeMlFromStandardDrinks(standardDrinks: number, abv: number): number {
  if (!abv) return 355;
  return Math.round((standardDrinks * 14 * 100) / (0.789 * abv));
}

function fmtSober(bac: number): string {
  const h = bac / 0.015;
  if (h <= 0) return "NOW";
  const hh = Math.floor(h),
    mm = Math.round((h - hh) * 60);
  return hh === 0 ? `${mm}M` : mm === 0 ? `${hh}H` : `${hh}H ${mm}M`;
}

function fmtSession(start: Date): string {
  const h = (Date.now() - start.getTime()) / 3_600_000;
  const hh = Math.floor(h),
    mm = Math.round((h - hh) * 60);
  return hh === 0 ? `${mm}M` : mm === 0 ? `${hh}H` : `${hh}H ${mm}M`;
}

function getBACStatus(bac: number) {
  if (bac === 0)
    return {
      label: "SOBER",
      color: C.safe,
      bg: "#0D1F14",
      advice: "ALL CLEAR. STAY HYDRATED.",
    };
  if (bac < BAC_SAFE)
    return {
      label: "MILD",
      color: C.safe,
      bg: "#0D1F14",
      advice: "MILD EFFECTS. DRINK WATER.",
    };
  if (bac < BAC_CAUTION)
    return {
      label: "CAUTION",
      color: C.caution,
      bg: "#1F1A08",
      advice: "COORDINATION AFFECTED. NO DRIVING.",
    };
  if (bac < BAC_DANGER)
    return {
      label: "HIGH",
      color: C.red,
      bg: C.redDark,
      advice: "SIGNIFICANTLY IMPAIRED. STOP NOW.",
    };
  return {
    label: "DANGER",
    color: C.paper,
    bg: C.red,
    advice: "SEEK HELP IMMEDIATELY.",
  };
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

const BACGauge = ({ bac }: { bac: number }) => {
  const status = getBACStatus(bac);
  const trackW = SW - 64;
  const fillPct = Math.min(bac / 0.2, 1);

  return (
    <View style={[ gS.wrap, bac >= BAC_DANGER && { borderColor: C.red, borderWidth: 2 } ]}>
      <View style={gS.topRow}>
        <View>
          <Text style={gS.bacLabel}>BLOOD ALCOHOL CONTENT</Text>
          <Text style={[gS.bacNum, { color: status.color }]}>
            {bac.toFixed(3)}
            <Text style={gS.bacPct}>%</Text>
          </Text>
        </View>
        <View style={[ gS.badge, { backgroundColor: status.bg, borderColor: status.color } ]}>
          <Text style={[gS.badgeTxt, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <View style={[gS.track, { width: trackW }]}>
        <View style={[ gS.fill, { width: fillPct * trackW, backgroundColor: status.color } ]} />
        {[BAC_SAFE, BAC_CAUTION, BAC_DANGER].map((v) => (
          <View key={v} style={[gS.tick, { left: (v / 0.2) * trackW }]} />
        ))}
      </View>
      <View style={gS.zoneRow}>
        {["SAFE", "CAUTION", "HIGH", "DANGER"].map((z, i) => (
          <Text key={z} style={[ gS.zoneLbl, { color: [C.safe, C.caution, C.red, C.red][i] } ]}>
            {z}
          </Text>
        ))}
      </View>
      <View style={[ gS.advice, { backgroundColor: status.bg, borderColor: status.color } ]}>
        <Text style={[gS.adviceTxt, { color: status.color }]}>{status.advice}</Text>
      </View>
    </View>
  );
};

const gS = StyleSheet.create({
  wrap: { backgroundColor: C.surface, borderRadius: 2, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  bacLabel: { color: C.muted, fontSize: 12, fontFamily: MONO, letterSpacing: 2.5, marginBottom: 4 },
  bacNum: { fontSize: 52, fontFamily: MONO, fontWeight: "900", letterSpacing: -2, lineHeight: 52 },
  bacPct: { fontSize: 20, fontWeight: "400", letterSpacing: 0 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 2, borderWidth: 1.5, marginTop: 4 },
  badgeTxt: { fontSize: 14, fontFamily: MONO, fontWeight: "900", letterSpacing: 2 },
  track: { height: 12, backgroundColor: C.surfaceAlt, borderRadius: 1, overflow: "visible", marginBottom: 5, position: "relative", borderWidth: 1, borderColor: C.border },
  fill: { height: "100%", borderRadius: 1, position: "absolute", left: 0, opacity: 0.9 },
  tick: { position: "absolute", top: -4, width: 2, height: 20, backgroundColor: C.bg },
  zoneRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  zoneLbl: { fontSize: 11, fontFamily: MONO, letterSpacing: 1.5, fontWeight: "900" },
  advice: { borderWidth: 1, borderRadius: 2, padding: 10 },
  adviceTxt: { fontSize: 14, fontFamily: MONO, fontWeight: "900", letterSpacing: 1.5 },
});

const StatBox = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <View style={stS.box}>
    <Text style={[stS.val, color ? { color } : {}]}>{value}</Text>
    <Text style={stS.lbl}>{label}</Text>
  </View>
);
const stS = StyleSheet.create({
  box: { flex: 1, alignItems: "center", backgroundColor: C.surface, borderRadius: 2, paddingVertical: 12, borderWidth: 1, borderColor: C.border },
  val: { color: C.text, fontSize: 24, fontFamily: MONO, fontWeight: "900" },
  lbl: { color: C.muted, fontSize: 11, fontFamily: MONO, marginTop: 4, letterSpacing: 2, textAlign: "center" },
});

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
  wrap: { flexDirection: "row", alignItems: "center", backgroundColor: C.redDark, borderRadius: 2, padding: 14, marginBottom: 12, gap: 12, borderWidth: 1.5, borderColor: C.red, borderStyle: "dashed" },
  skull: { fontSize: 26, color: C.paper },
  title: { color: C.paper, fontSize: 15, fontFamily: MONO, fontWeight: "900", letterSpacing: 1.5 },
  sub: { color: "#FFB3B3", fontSize: 12, fontFamily: MONO, letterSpacing: 1, marginTop: 3 },
  arrow: { color: C.paper, fontSize: 22 },
});

const WaterNudge = ({ onDismiss }: { onDismiss: () => void }) => (
  <View style={wS.wrap}>
    <Text style={wS.icon}>💧</Text>
    <Text style={wS.text}>WATER BREAK — hydration helps your body process alcohol.</Text>
    <TouchableOpacity onPress={onDismiss}>
      <Text style={wS.ok}>OK</Text>
    </TouchableOpacity>
  </View>
);
const wS = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#0A1520", borderWidth: 1, borderColor: "#2A4A6A", borderStyle: "dashed", borderRadius: 2, padding: 12, marginBottom: 12, gap: 10 },
  icon: { fontSize: 16 },
  text: { flex: 1, color: "#7EB8D8", fontSize: 12, fontFamily: MONO, letterSpacing: 1, lineHeight: 17 },
  ok: { color: "#7EB8D8", fontSize: 13, fontFamily: MONO, fontWeight: "900", letterSpacing: 2, paddingLeft: 6 },
});

const DrinkLogItem = ({ entry, onRemove }: { entry: DrinkEntry; onRemove: () => void }) => {
  const min = Math.round((Date.now() - entry.timestamp.getTime()) / 60000);
  const ago = min < 1 ? "JUST NOW" : min < 60 ? `${min}M AGO` : `${Math.floor(min / 60)}H AGO`;
  return (
    <View style={liS.row}>
      <Text style={liS.emoji}>{entry.emoji}</Text>
      <View style={liS.info}>
        <Text style={liS.name}>{entry.type}</Text>
        <Text style={liS.time}>{ago} · {entry.standardDrinks.toFixed(1)} STD</Text>
      </View>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={liS.x}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};
const liS = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 11, paddingHorizontal: 12, backgroundColor: C.surfaceAlt, borderRadius: 2, marginBottom: 6, gap: 10, borderLeftWidth: 3, borderLeftColor: C.red },
  emoji: { fontSize: 20 },
  info: { flex: 1 },
  name: { color: C.text, fontSize: 14, fontFamily: MONO, fontWeight: "900", letterSpacing: 2 },
  time: { color: C.muted, fontSize: 12, fontFamily: MONO, letterSpacing: 1, marginTop: 3 },
  x: { color: C.muted, fontSize: 15 },
});

const Divider = ({ label }: { label: string }) => (
  <View style={dvS.row}>
    <View style={dvS.line} />
    <Text style={dvS.lbl}>{label}</Text>
    <View style={dvS.line} />
  </View>
);
const dvS = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 14 },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  lbl: { color: C.muted, fontSize: 12, fontFamily: MONO, letterSpacing: 3, fontWeight: "900" },
});

// ═══════════════════════════════════════════════════════════════════════════════
// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function DrinkTrackerFAB({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [drinks, setDrinks] = useState<DrinkEntry[]>([]);
  const [drinkOptionsFromApi, setDrinkOptionsFromApi] = useState<DrinkOption[]>([]);
  const [bac, setBac] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [waterNudge, setWaterNudge] = useState(false);
  const [sessionStart]              = useState(new Date());
  const [tick, setTick]             = useState(0);
  const [bacProfile, setBacProfile] = useState<BACProfile>({ weightLbs: DEFAULT_WEIGHT_LBS, gender: DEFAULT_GENDER });
  const [autoAlertSent, setAutoAlertSent] = useState(false);
  const [drinkSearchQuery, setDrinkSearchQuery] = useState("");

  const drinkOptions: DrinkOption[] = [...DRINK_TYPES, ...drinkOptionsFromApi];
  const filteredDrinkOptions = drinkSearchQuery.trim()
    ? drinkOptions.filter((d) => d.label.toLowerCase().includes(drinkSearchQuery.trim().toLowerCase()))
    : drinkOptions;

  const pulse  = useRef(new Animated.Value(1)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const slideY = useRef(new Animated.Value(800)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // Handle Press In/Out for hover-like effect
  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.92, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => { if (g.dy > 0) dragY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          Animated.timing(dragY, { toValue: 800, duration: 250, useNativeDriver: true }).start(() => {
            setOpen(false);
            dragY.setValue(0);
          });
        } else {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        if (raw) {
          const user = JSON.parse(raw);
          const p = user?.profile;
          if (p && typeof p.weightLbs === "number") {
            setBacProfile({ weightLbs: p.weightLbs, gender: p.gender === "male" ? "male" : "female" });
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { setBac(calcBAC(drinks, bacProfile)); }, [drinks, tick, bacProfile]);

  useEffect(() => {
    if (bac >= BAC_DANGER) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.18, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [bac >= BAC_DANGER]);

  useEffect(() => {
    Animated.spring(slideY, { toValue: open ? 0 : 800, useNativeDriver: true, damping: 22, stiffness: 200 }).start();
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getDrinks();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data as { drinks?: unknown[] })?.drinks;
        if (!Array.isArray(list)) return;
        const options: DrinkOption[] = list.map((d: any) => ({
          id: d._id,
          label: d.name ?? "Drink",
          emoji: CATEGORY_EMOJI[String(d.category ?? "").toLowerCase()] ?? "🍹",
          standardDrinks: typeof d.standardDrinks === "number" ? d.standardDrinks : 1,
          abv: typeof d.abv === "number" ? d.abv : 5,
        }));
        if (!cancelled) setDrinkOptionsFromApi(options);
      } catch {
        if (!cancelled) setDrinkOptionsFromApi([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const removeDrink = useCallback((id: string) => { setDrinks((prev) => prev.filter((d) => d.id !== id)); }, []);

  const addDrink = useCallback((dt: DrinkOption) => {
    setDrinks((prev) => {
      const timestamp = new Date();
      const draftEntry = {
        id: Date.now().toString(),
        type: dt.label,
        emoji: dt.emoji,
        standardDrinks: dt.standardDrinks,
        timestamp,
      };
      const bacAtLog = calcBAC([draftEntry as DrinkEntry, ...prev], bacProfile);
      const entry: DrinkEntry = { ...draftEntry, bacAtLog };
      const next = [entry, ...prev];
      if (next.length % 3 === 0) setWaterNudge(true);
      return next;
    });
    (async () => {
      try {
        await api.logDrink({ drinkId: dt.id, drinkName: dt.label, category: labelToCategory(dt.label), abv: dt.abv, volumeMl: volumeMlFromStandardDrinks(dt.standardDrinks, dt.abv) });
      } catch {}
    })();
  }, [bacProfile]);

  const verifyAndAddDrink = useCallback(async (dt: DrinkOption) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera access needed", "Allow camera access for Gemini verification.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 0.8, base64: true });
    if (result.canceled || !result.assets[0]?.base64 || verifying) return;

    setVerifying(true);
    try {
      const analysis = await verifyDrinkWithGemini(result.assets[0].base64, dt.label, result.assets[0].mimeType === "image/png" ? "image/png" : "image/jpeg");
      await speakText(analysis.voiceMessage);
      if (!analysis.allowed) {
        Alert.alert("Verification failed", analysis.summary);
        return;
      }
      addDrink(dt);
      Alert.alert("Drink verified", analysis.summary);
    } catch (error) {
      Alert.alert("Verification error", "Could not verify drink.");
    } finally { setVerifying(false); }
  }, [addDrink, verifying]);

  const promptVerifyDrink = useCallback(
    async (drinkIdToRevoke?: string) => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Camera access needed", "Allow camera access to verify your drink for tampering.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 0.8, base64: true });
      if (result.canceled || !result.assets[0]?.base64) return;
      setVerifying(true);
      try {
        const analysis = await analyzeDrinkForSpoofing(
          result.assets[0].base64,
          (result.assets[0].mimeType as "image/jpeg" | "image/png") ?? "image/jpeg"
        );
        if (!analysis.safe && drinkIdToRevoke) removeDrink(drinkIdToRevoke);
        Alert.alert(
          analysis.safe ? "Drink looks OK" : "Possible concerns",
          analysis.summary + (analysis.concerns?.length ? "\n\n" + analysis.concerns.join("\n") : "")
        );
      } finally {
        setVerifying(false);
      }
    },
    [removeDrink]
  );

  const showVerifyDrinkPrompt = useCallback(
    (entry: { id: string }) => {
      Alert.alert(
        "Verify your drink?",
        "Take a photo to check for signs of tampering or spoofing. If concerns are found, the drink will not be logged.",
        [
          { text: "Skip", style: "cancel" },
          { text: "Take photo", onPress: () => promptVerifyDrink(entry.id) },
        ]
      );
    },
    [promptVerifyDrink]
  );

  const endSession = () =>
    Alert.alert("END SESSION", "Clear all drinks and reset BAC?", [
      { text: "CANCEL", style: "cancel" },
      {
        text: "RESET",
        style: "destructive",
        onPress: () => {
          setDrinks([]);
          setWaterNudge(false);
          setAutoAlertSent(false);
          setOpen(false);
        },
      },
    ]);

  const sendAlert = useCallback(async () => {
    let locationText = "Location unavailable.";
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        locationText = `Coordinates: ${lat}, ${lng}. Map: https://maps.google.com/?q=${lat},${lng}`;
      }
    } catch {
      // Keep fallback location text.
    }
    const alertMessage = `SipSafe alert: I may need help. BAC: ${bac.toFixed(3)}%. Time: ${new Date().toLocaleString()}. ${locationText}`;
    try {
      type Contact = { label: string; phone: string };
      let contacts: Contact[] = [];

      // Always prefer current account profile from backend.
      try {
        const me = await api.getMe();
        if (me?.profile != null && !me.error) {
          const asUser = { id: me.id, email: me.email, profile: me.profile };
          await AsyncStorage.setItem("user", JSON.stringify(asUser));
          if (Array.isArray(me.profile?.emergencyContacts)) {
            contacts = me.profile.emergencyContacts
              .map((c: { label?: string; phone?: string }) => ({
                label: String(c?.label ?? "").trim(),
                phone: String(c?.phone ?? "").trim(),
              }))
              .filter((c: Contact) => c.label.length > 0 && c.phone.length > 0);
          }
        }
      } catch {
        // Fall back to locally cached logged-in user profile.
      }

      if (contacts.length === 0) {
        const rawUser = await AsyncStorage.getItem("user");
        if (rawUser) {
          const parsed = JSON.parse(rawUser) as {
            profile?: { emergencyContacts?: Array<{ label?: string; phone?: string }> };
          };
          if (Array.isArray(parsed?.profile?.emergencyContacts)) {
            contacts = parsed.profile.emergencyContacts
              .map((c: { label?: string; phone?: string }) => ({
                label: String(c?.label ?? "").trim(),
                phone: String(c?.phone ?? "").trim(),
              }))
              .filter((c: Contact) => c.label.length > 0 && c.phone.length > 0);
          }
        }
      }

      if (contacts.length === 0) {
        Alert.alert(
          "No emergency contacts",
          "Add at least one emergency contact in Profile before sending alerts.",
          [{ text: "OK" }],
        );
        return;
      }
      const recipients = contacts
        .map((c) => ({
          label: c.label,
          phone: c.phone.replace(/[^\d+]/g, ""),
        }))
        .filter((v) => v.phone.length >= 10 && v.phone !== "1234567890");
      if (recipients.length === 0) {
        Alert.alert("No emergency contacts", "Add emergency contact phone numbers in Profile.", [{ text: "OK" }]);
        return;
      }
      const queryPrefix = Platform.OS === "ios" ? "&" : "?";
      let selectedUrl: string | null = null;
      let selectedLabel = "Emergency contact";
      for (const recipient of recipients) {
        const url = `sms:${recipient.phone}${queryPrefix}body=${encodeURIComponent(alertMessage)}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          selectedUrl = url;
          selectedLabel = recipient.label || "Emergency contact";
          break;
        }
      }
      if (!selectedUrl) {
        Alert.alert("SMS unavailable", "Could not open the Messages app on this device.", [{ text: "OK" }]);
        return;
      }
      await Linking.openURL(selectedUrl);
      Alert.alert("Alert ready", `Message prepared for ${selectedLabel}. Tap send in Messages.`, [{ text: "OK" }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      Alert.alert(
        "Alert failed",
        message,
        [{ text: "OK" }],
      );
    }
  }, [bac]);

  const status = getBACStatus(bac);
  const totalStd = drinks.reduce((s, d) => s + d.standardDrinks, 0);
  const isDanger = bac >= BAC_DANGER;

  useEffect(() => {
    if (!autoAlertSent && bac >= BAC_DANGER && drinks.length > 0) {
      setAutoAlertSent(true);
      void sendAlert();
    }
  }, [autoAlertSent, bac, drinks.length, sendAlert]);

  // FAB appearance reacts to session state
  const fabBg = drinks.length === 0 ? C.surface : isDanger ? C.red : C.redDark;

  return (
    <View style={{ flex: 1 }}>
      {children}

      <Animated.View style={[fabS.wrap, { transform: [{ scale: Animated.multiply(pulse, pressAnim) }] }]}>
        <TouchableOpacity
          style={[fabS.btn, { backgroundColor: fabBg }]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => setOpen(true)}
          activeOpacity={0.7}
        >
          {drinks.length > 0 && (
            <View style={fabS.badge}>
              <Text style={[fabS.badgeTxt, { color: isDanger ? C.red : C.redDark }]}>{bac.toFixed(2)}</Text>
            </View>
          )}
          <Text style={fabS.label}>TRACK</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        {verifying && (
          <View style={shS.verifyingOverlay}>
            <ActivityIndicator size="large" color={C.orange} />
            <Text style={shS.verifyingTxt}>Analyzing drink...</Text>
          </View>
        )}
        <TouchableOpacity style={shS.overlay} activeOpacity={1} onPress={() => setOpen(false)} />
        <Animated.View style={[shS.sheet, { transform: [{ translateY: Animated.add(slideY, dragY) }] }]}>
          <View style={shS.handleRow} {...panResponder.panHandlers}>
            <View style={shS.handle} />
            <Text style={shS.handleHint}>drag to close</Text>
          </View>
          <View style={shS.header}>
            <View>
              <Text style={shS.eyebrow}>// ACTIVE SESSION · {fmtSession(sessionStart)}</Text>
              <Text style={shS.title}>SIP<Text style={{ color: C.red }}>SAFE</Text><Text style={shS.titleSub}> TRACKER</Text></Text>
            </View>
            <TouchableOpacity style={shS.endBtn} onPress={endSession}><Text style={shS.endBtnTxt}>END</Text></TouchableOpacity>
          </View>
          <View style={shS.ticker}>
            <Text style={shS.tickerTxt} numberOfLines={1}>
              DRINKS: {drinks.length} ·· STD: {bac.toFixed(3)}% ·· SOBER IN: {fmtSober(bac)}
            </Text>
          </View>
          <ScrollView style={shS.scroll} contentContainerStyle={shS.content} keyboardShouldPersistTaps="handled">
            {isDanger && <DangerBanner onAlert={sendAlert} />}
            <BACGauge bac={bac} />
            <View style={shS.searchWrap}>
              <TextInput style={shS.searchInput} placeholder="Search drinks..." placeholderTextColor={C.muted} value={drinkSearchQuery} onChangeText={setDrinkSearchQuery} />
            </View>
            <View style={shS.gridViewport}>
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={filteredDrinkOptions.length > 9}
                contentContainerStyle={shS.grid}
              >
                {filteredDrinkOptions.map((dt) => (
                  <TouchableOpacity key={dt.id ?? dt.label} style={shS.drinkBtn} onPress={() => verifyAndAddDrink(dt)}>
                    <Text style={shS.drinkEmoji}>{dt.emoji}</Text>
                    <Text style={shS.drinkName}>{dt.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity style={shS.alertBtn} onPress={sendAlert}><Text style={shS.alertBtnTxt}>📍 ALERT MY FRIENDS</Text></TouchableOpacity>
            <View style={shS.logSection}>
              <Text style={shS.logTitle}>DRINK LOG</Text>
              {drinks.length === 0 ? (
                <Text style={shS.logEmpty}>NO DRINKS LOGGED YET.</Text>
              ) : (
                drinks.map((drink) => (
                  <View key={drink.id} style={shS.logRow}>
                    <Text style={shS.logDrink}>{drink.emoji} {drink.type}</Text>
                    <Text style={shS.logBac}>BAC {drink.bacAtLog.toFixed(3)}%</Text>
                  </View>
                ))
              )}
            </View>
            <Text style={shS.disclaimer}>BAC IS AN ESTIMATE. NEVER DRIVE IMPAIRED.</Text>
            <View style={{ height: 48 }} />
          </ScrollView>
        </Animated.View>
      </Modal>
    </View>
  );
}

const fabS = StyleSheet.create({
  wrap: { 
    position: "absolute", 
    bottom: 100, 
    right: 20, 
    zIndex: 999 
  },
  btn: {
    // CHANGED: Adjusted dimensions to look more like a card
    width: 90, 
    height: 80,
    // CHANGED: borderRadius 20 matches your dashboard statCard aesthetic
    borderRadius: 20, 
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    
    // GLOW EFFECT: Shadow remains punchy to define the square shape
    shadowColor: "#ff4000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 15,
  },
  label: {
    color: "#F0EBE1", 
    fontSize: 18, 
    fontFamily: "BebasNeue", 
    letterSpacing: 1.4, 
    textAlign: 'center' 
  },
  badge: { 
    position: "absolute", 
    // CHANGED: Negative offsets to make the badge "pop" off the corner
    top: -5, 
    right: -5, 
    backgroundColor: "#F0EBE1", 
    borderRadius: 8, // Square-ish badge to match the button
    paddingHorizontal: 6, 
    paddingVertical: 3, 
    borderWidth: 1.5, 
    borderColor: "#ff4000", 
    zIndex: 1 
  },
  badgeTxt: {
    fontSize: 14,
    fontFamily: MONO, 
    fontWeight: "900" 
  },
});

const shS = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.72)" },
  verifyingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1000, alignItems: "center", justifyContent: "center" },
  verifyingTxt: { color: "#ff4000", fontSize: 14, fontFamily: MONO, fontWeight: "900", letterSpacing: 2 },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#0E0B09", borderTopLeftRadius: 4, borderTopRightRadius: 4, borderTopWidth: 2, borderTopColor: "#ff4000", maxHeight: "90%" },
  handleRow: { alignItems: "center", paddingTop: 10, paddingBottom: 2 },
  handle: { width: 36, height: 3, backgroundColor: "#2C2520", borderRadius: 2 },
  handleHint: { color: "#2C2520", fontSize: 11, fontFamily: MONO, letterSpacing: 2 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12 },
  eyebrow: { color: "#6B5E52", fontSize: 12, fontFamily: MONO, letterSpacing: 2 },
  title: { color: "#F0EBE1", fontSize: 24, fontFamily: MONO, fontWeight: "900", letterSpacing: 3 },
  titleSub: { color: "#6B5E52", fontSize: 15, fontWeight: "400" },
  endBtn: { borderWidth: 1.5, borderColor: "#2C2520", borderRadius: 2, paddingHorizontal: 14, paddingVertical: 8 },
  endBtnTxt: { color: "#6B5E52", fontSize: 13, fontFamily: MONO, fontWeight: "900" },
  ticker: { backgroundColor: "#ff4000", paddingVertical: 5, paddingHorizontal: 14 },
  tickerTxt: { color: "#F0EBE1", fontSize: 12, fontFamily: MONO, fontWeight: "700" },
  scroll: { flex: 1 },
  content: { padding: 14 },
  searchWrap: { marginBottom: 12 },
  searchInput: { backgroundColor: "#1E1A17", borderWidth: 1, borderColor: "#2C2520", borderRadius: 2, paddingHorizontal: 14, paddingVertical: 12, color: "#F0EBE1", fontSize: 16, fontFamily: MONO },
  gridViewport: { maxHeight: 260, marginBottom: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  drinkBtn: { width: (SW - 52) / 3, backgroundColor: "#161210", borderRadius: 2, borderWidth: 1, borderColor: "#2C2520", alignItems: "center", paddingVertical: 14 },
  drinkEmoji: { fontSize: 24, marginBottom: 5 },
  drinkName: { color: "#F0EBE1", fontSize: 12, fontFamily: MONO, fontWeight: "900", textAlign: "center" },
  alertBtn: { backgroundColor: "#161210", borderWidth: 1.5, borderColor: "#ff4000", borderRadius: 2, paddingVertical: 15, alignItems: "center" },
  alertBtnTxt: { color: "#ff4000", fontSize: 14, fontFamily: MONO, fontWeight: "900", letterSpacing: 2.5 },
  logSection: { marginTop: 12, backgroundColor: "#161210", borderWidth: 1, borderColor: "#2C2520", borderRadius: 2, padding: 12 },
  logTitle: { color: "#F0EBE1", fontSize: 13, fontFamily: MONO, fontWeight: "900", letterSpacing: 1.5, marginBottom: 8 },
  logEmpty: { color: "#6B5E52", fontSize: 13, fontFamily: MONO },
  logRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#2C2520" },
  logDrink: { color: "#F0EBE1", fontSize: 13, fontFamily: MONO, fontWeight: "700" },
  logBac: { color: "#ff4000", fontSize: 13, fontFamily: MONO, fontWeight: "900" },
  disclaimer: { color: "#2C2520", fontSize: 11, fontFamily: MONO, textAlign: "center", marginTop: 20 },
});
