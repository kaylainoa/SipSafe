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

import { api } from "@/constants/api";
import { analyzeDrinkForSpoofing } from "@/lib/drinkSpoofingDetection";
import { speakText } from "@/lib/elevenlabsTTS";
import { verifyDrinkWithGemini } from "@/lib/geminiDrinkVerification";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width: SW } = Dimensions.get("window");

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
  text: "#F0EBE1",
  muted: "#6B5E52",
};
const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

// ─── Drink types (static + from API) ──────────────────────────────────────────
export type DrinkOption = {
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
  timestamp: Date;
}

const WIDMARK_R = { male: 0.73, female: 0.66 };
const BAC_SAFE = 0.06;
const BAC_CAUTION = 0.1;
const BAC_DANGER = 0.15;

// Replace with values from your profile context/store in a real app:
const USER_WEIGHT_LBS = 130;
const USER_SEX: "male" | "female" = "female";

function calcBAC(drinks: DrinkEntry[]): number {
  if (!drinks.length) return 0;
  const wKg = USER_WEIGHT_LBS * 0.453592;
  let bac = 0;
  for (const d of drinks) {
    const hrs = (Date.now() - d.timestamp.getTime()) / 3_600_000;
    const peak =
      ((d.standardDrinks * 14) / (wKg * 1000 * WIDMARK_R[USER_SEX])) * 100;
    bac += peak - Math.min(peak, hrs * 0.015);
  }
  return Math.max(0, bac);
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

// ═══════════════════════════════════════════════════════════════════════════════
// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const BACGauge = ({ bac }: { bac: number }) => {
  const status = getBACStatus(bac);
  const trackW = SW - 64;
  const fillPct = Math.min(bac / 0.2, 1);

  return (
    <View
      style={[
        gS.wrap,
        bac >= BAC_DANGER && { borderColor: C.red, borderWidth: 2 },
      ]}
    >
      <View style={gS.topRow}>
        <View>
          <Text style={gS.bacLabel}>BLOOD ALCOHOL CONTENT</Text>
          <Text style={[gS.bacNum, { color: status.color }]}>
            {bac.toFixed(3)}
            <Text style={gS.bacPct}>%</Text>
          </Text>
        </View>
        <View
          style={[
            gS.badge,
            { backgroundColor: status.bg, borderColor: status.color },
          ]}
        >
          <Text style={[gS.badgeTxt, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>
      <View style={[gS.track, { width: trackW }]}>
        <View
          style={[
            gS.fill,
            { width: fillPct * trackW, backgroundColor: status.color },
          ]}
        />
        {[BAC_SAFE, BAC_CAUTION, BAC_DANGER].map((v) => (
          <View key={v} style={[gS.tick, { left: (v / 0.2) * trackW }]} />
        ))}
      </View>
      <View style={gS.zoneRow}>
        {["SAFE", "CAUTION", "HIGH", "DANGER"].map((z, i) => (
          <Text
            key={z}
            style={[
              gS.zoneLbl,
              { color: [C.safe, C.caution, C.red, C.red][i] },
            ]}
          >
            {z}
          </Text>
        ))}
      </View>
      <View
        style={[
          gS.advice,
          { backgroundColor: status.bg, borderColor: status.color },
        ]}
      >
        <Text style={[gS.adviceTxt, { color: status.color }]}>
          {status.advice}
        </Text>
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
    fontFamily: MONO,
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  bacNum: {
    fontSize: 48,
    fontFamily: MONO,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 48,
  },
  bacPct: { fontSize: 18, fontWeight: "400", letterSpacing: 0 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 2,
    borderWidth: 1.5,
    marginTop: 4,
  },
  badgeTxt: {
    fontSize: 11,
    fontFamily: MONO,
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
  fill: {
    height: "100%",
    borderRadius: 1,
    position: "absolute",
    left: 0,
    opacity: 0.9,
  },
  tick: {
    position: "absolute",
    top: -4,
    width: 2,
    height: 20,
    backgroundColor: C.bg,
  },
  zoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  zoneLbl: {
    fontSize: 8,
    fontFamily: MONO,
    letterSpacing: 1.5,
    fontWeight: "900",
  },
  advice: { borderWidth: 1, borderRadius: 2, padding: 10 },
  adviceTxt: {
    fontSize: 11,
    fontFamily: MONO,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});

const StatBox = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <View style={stS.box}>
    <Text style={[stS.val, color ? { color } : {}]}>{value}</Text>
    <Text style={stS.lbl}>{label}</Text>
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
  val: { color: C.text, fontSize: 20, fontFamily: MONO, fontWeight: "900" },
  lbl: {
    color: C.muted,
    fontSize: 8,
    fontFamily: MONO,
    marginTop: 4,
    letterSpacing: 2,
    textAlign: "center",
  },
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
    fontFamily: MONO,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  sub: {
    color: "#FFB3B3",
    fontSize: 9,
    fontFamily: MONO,
    letterSpacing: 1,
    marginTop: 3,
  },
  arrow: { color: C.paper, fontSize: 22 },
});

const WaterNudge = ({ onDismiss }: { onDismiss: () => void }) => (
  <View style={wS.wrap}>
    <Text style={wS.icon}>💧</Text>
    <Text style={wS.text}>
      WATER BREAK — hydration helps your body process alcohol.
    </Text>
    <TouchableOpacity onPress={onDismiss}>
      <Text style={wS.ok}>OK</Text>
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
    fontFamily: MONO,
    letterSpacing: 1,
    lineHeight: 14,
  },
  ok: {
    color: "#7EB8D8",
    fontSize: 11,
    fontFamily: MONO,
    fontWeight: "900",
    letterSpacing: 2,
    paddingLeft: 6,
  },
});

const DrinkLogItem = ({
  entry,
  onRemove,
}: {
  entry: DrinkEntry;
  onRemove: () => void;
}) => {
  const min = Math.round((Date.now() - entry.timestamp.getTime()) / 60000);
  const ago =
    min < 1
      ? "JUST NOW"
      : min < 60
        ? `${min}M AGO`
        : `${Math.floor(min / 60)}H AGO`;
  return (
    <View style={liS.row}>
      <Text style={liS.emoji}>{entry.emoji}</Text>
      <View style={liS.info}>
        <Text style={liS.name}>{entry.type}</Text>
        <Text style={liS.time}>
          {ago} · {entry.standardDrinks.toFixed(1)} STD
        </Text>
      </View>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={liS.x}>✕</Text>
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
    fontFamily: MONO,
    fontWeight: "900",
    letterSpacing: 2,
  },
  time: {
    color: C.muted,
    fontSize: 9,
    fontFamily: MONO,
    letterSpacing: 1,
    marginTop: 3,
  },
  x: { color: C.muted, fontSize: 13 },
});

const Divider = ({ label }: { label: string }) => (
  <View style={dvS.row}>
    <View style={dvS.line} />
    <Text style={dvS.lbl}>{label}</Text>
    <View style={dvS.line} />
  </View>
);
const dvS = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 14,
  },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  lbl: {
    color: C.muted,
    fontSize: 9,
    fontFamily: MONO,
    letterSpacing: 3,
    fontWeight: "900",
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function DrinkTrackerFAB({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [drinks, setDrinks] = useState<DrinkEntry[]>([]);
  const [drinkOptionsFromApi, setDrinkOptionsFromApi] = useState<DrinkOption[]>([]);
  const [bac, setBac] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [waterNudge, setWaterNudge] = useState(false);
  const [sessionStart] = useState(new Date());
  const [tick, setTick] = useState(0);

  // All drink options: static types + drinks from database
  const drinkOptions: DrinkOption[] = [
    ...DRINK_TYPES,
    ...drinkOptionsFromApi,
  ];

  const pulse = useRef(new Animated.Value(1)).current;
  const slideY = useRef(new Animated.Value(800)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // PanResponder — drag the handle down to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) dragY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          Animated.timing(dragY, {
            toValue: 800,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            setOpen(false);
            dragY.setValue(0);
          });
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    }),
  ).current;

  // BAC live tick
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    setBac(calcBAC(drinks));
  }, [drinks, tick]);

  // FAB pulses when BAC is dangerous
  useEffect(() => {
    if (bac >= BAC_DANGER) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.18,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [bac >= BAC_DANGER]);

  // Sheet slide animation
  useEffect(() => {
    Animated.spring(slideY, {
      toValue: open ? 0 : 800,
      useNativeDriver: true,
      damping: 22,
      stiffness: 200,
    }).start();
  }, [open]);

  // Fetch drinks from database for "log a drink" section
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getDrinks();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data as { drinks?: unknown[] })?.drinks;
        if (!Array.isArray(list)) return;
        const options: DrinkOption[] = list.map((d: { _id?: string; name?: string; category?: string; abv?: number; standardDrinks?: number }) => ({
          id: d._id,
          label: d.name ?? "Drink",
          emoji: CATEGORY_EMOJI[String(d.category ?? "").toLowerCase()] ?? "🍹",
          standardDrinks: typeof d.standardDrinks === "number" ? d.standardDrinks : 1,
          abv: typeof d.abv === "number" ? d.abv : 5,
        }));
        if (!cancelled) setDrinkOptionsFromApi(options);
      } catch {
        // Offline or API error: keep only static drinks
        if (!cancelled) setDrinkOptionsFromApi([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const removeDrink = useCallback((id: string) => {
    setDrinks((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const promptVerifyDrink = useCallback(
    async (drinkIdToRevoke?: string) => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Camera access needed",
          "Allow camera access to verify your drink for tampering.",
          [{ text: "OK" }],
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });
      if (result.canceled || !result.assets[0]?.base64) return;

      setVerifying(true);
      try {
        const analysis = await analyzeDrinkForSpoofing(
          result.assets[0].base64,
          (result.assets[0].mimeType as "image/jpeg" | "image/png") ??
            "image/jpeg",
        );
        if (!analysis.safe && drinkIdToRevoke) {
          removeDrink(drinkIdToRevoke);
        }
        const title = analysis.safe
          ? "✓ Drink looks OK"
          : "⚠ Possible concerns";
        const body = analysis.safe
          ? analysis.summary +
            (analysis.concerns.length > 0
              ? `\n\n${analysis.concerns.join("\n")}`
              : "")
          : (drinkIdToRevoke ? "Drink removed from log.\n\n" : "") +
            analysis.summary +
            (analysis.concerns.length > 0
              ? `\n\n${analysis.concerns.join("\n")}`
              : "");
        Alert.alert(title, body, [{ text: "OK" }]);
      } finally {
        setVerifying(false);
      }
    },
    [removeDrink],
  );

  const addDrink = useCallback((dt: DrinkOption) => {
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

  const verifyAndAddDrink = useCallback(
    async (dt: DrinkOption) => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Camera access needed",
          "Allow camera access so Gemini can verify drink type, spoofing, and possible drugging signs.",
          [{ text: "OK" }],
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });
      if (result.canceled || !result.assets[0]?.base64 || verifying) return;

      const mimeType = result.assets[0].mimeType;
      const safeMimeType =
        mimeType === "image/png" || mimeType === "image/webp"
          ? mimeType
          : "image/jpeg";

      setVerifying(true);
      try {
        const analysis = await verifyDrinkWithGemini(
          result.assets[0].base64,
          dt.label,
          safeMimeType,
        );

        await speakText(analysis.voiceMessage);

        if (!analysis.allowed) {
          const reasons: string[] = [];
          if (!analysis.isExpectedDrinkMatch) {
            reasons.push(
              `Expected ${dt.label}, but photo looked like ${analysis.matchedDrinkType}.`,
            );
          }
          if (analysis.spoofingLikely) {
            reasons.push("Possible spoofing/tampering indicators detected.");
          }
          if (analysis.druggingLikely) {
            reasons.push(
              "Possible drink spiking/drugging indicators detected.",
            );
          }
          const details = [...reasons, ...analysis.concerns].join("\n");
          Alert.alert(
            "Verification failed",
            `${analysis.summary}${details ? `\n\n${details}` : ""}\n\nDrink was not added.`,
            [{ text: "OK" }],
          );
          return;
        }

        addDrink(dt);
        const extra =
          analysis.concerns.length > 0
            ? `\n\nNotes:\n${analysis.concerns.join("\n")}`
            : "";
        Alert.alert("Drink verified", `${analysis.summary}${extra}`, [
          { text: "OK" },
        ]);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error.";
        const friendly =
          message.includes("model") || message.includes("404")
            ? "Gemini model configuration failed. Try again after setting a valid Gemini model."
            : "Gemini could not verify this drink right now. Please retake the photo.";
        await speakText("Verification failed. I could not verify this drink.");
        Alert.alert(
          "Verification error",
          `${friendly}\n\nTechnical detail: ${message}`,
          [{ text: "OK" }],
        );
      } finally {
        setVerifying(false);
      }
    },
    [addDrink, verifying],
  );
  function showVerifyDrinkPrompt(entry: DrinkEntry) {
    Alert.alert(
      "Verify your drink?",
      "Take a photo to check for signs of tampering or spoofing. If concerns are found, the drink will not be logged.",
      [
        { text: "Skip", style: "cancel" },
        { text: "Take photo", onPress: () => promptVerifyDrink(entry.id) },
      ],
    );
  }

  const endSession = () =>
    Alert.alert("END SESSION", "Clear all drinks and reset BAC?", [
      { text: "CANCEL", style: "cancel" },
      {
        text: "RESET",
        style: "destructive",
        onPress: () => {
          setDrinks([]);
          setWaterNudge(false);
          setOpen(false);
        },
      },
    ]);

  const sendAlert = () =>
    Alert.alert(
      "ALERT SENT",
      "Emergency contacts notified with your location.",
      [{ text: "OK" }],
    );

  const status = getBACStatus(bac);
  const totalStd = drinks.reduce((s, d) => s + d.standardDrinks, 0);
  const isDanger = bac >= BAC_DANGER;

  // FAB appearance reacts to session state
  const fabBg = drinks.length === 0 ? C.surface : isDanger ? C.red : C.redDark;
  const fabBorder = drinks.length === 0 ? C.border : C.red;

  return (
    <View style={{ flex: 1 }}>
      {/* ── Navigator renders underneath ── */}
      {children}

      {/* ══ FLOATING ACTION BUTTON ══════════════════════════════════════════ */}
      <Animated.View style={[fabS.wrap, { transform: [{ scale: pulse }] }]}>
        <TouchableOpacity
          style={[fabS.btn, { backgroundColor: fabBg, borderColor: fabBorder }]}
          onPress={() => setOpen(true)}
          activeOpacity={0.85}
        >
          {/* BAC mini-badge — appears as soon as drinks are logged */}
          {drinks.length > 0 && (
            <View style={fabS.badge}>
              <Text
                style={[fabS.badgeTxt, { color: isDanger ? C.red : C.redDark }]}
              >
                {bac.toFixed(2)}
              </Text>
            </View>
          )}
          <Text style={fabS.icon}>🍺</Text>
          <Text style={fabS.label}>TRACK</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ══ BOTTOM SHEET MODAL ══════════════════════════════════════════════ */}
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        {verifying && (
          <View style={shS.verifyingOverlay}>
            <ActivityIndicator size="large" color={C.orange} />
            <Text style={shS.verifyingTxt}>Analyzing drink...</Text>
          </View>
        )}

        {/* Dim backdrop — tap outside to close */}
        <TouchableOpacity
          style={shS.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        />

        <Animated.View
          style={[
            shS.sheet,
            { transform: [{ translateY: Animated.add(slideY, dragY) }] },
          ]}
        >
          {/* Drag handle — drag down to close */}
          <View style={shS.handleRow} {...panResponder.panHandlers}>
            <View style={shS.handle} />
            <Text style={shS.handleHint}>drag to close</Text>
          </View>

          {/* Sheet header */}
          <View style={shS.header}>
            <View>
              <Text style={shS.eyebrow}>
                // ACTIVE SESSION · {fmtSession(sessionStart)}
              </Text>
              <Text style={shS.title}>
                SIP<Text style={{ color: C.red }}>SAFE</Text>
                <Text style={shS.titleSub}> TRACKER</Text>
              </Text>
              {verifying && (
                <Text style={shS.verifyStatus}>
                  VERIFYING PHOTO WITH GEMINI...
                </Text>
              )}
            </View>
            <TouchableOpacity style={shS.endBtn} onPress={endSession}>
              <Text style={shS.endBtnTxt}>END</Text>
            </TouchableOpacity>
          </View>

          {/* Ticker strip */}
          <View style={shS.ticker}>
            <Text style={shS.tickerTxt} numberOfLines={1}>
              DRINKS: {drinks.length} ·· STD: {totalStd.toFixed(1)} ·· BAC:{" "}
              {bac.toFixed(3)}% ·· SOBER IN: {fmtSober(bac)} ··
            </Text>
          </View>

          <ScrollView
            style={shS.scroll}
            contentContainerStyle={shS.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {isDanger && <DangerBanner onAlert={sendAlert} />}
            {waterNudge && !isDanger && (
              <WaterNudge onDismiss={() => setWaterNudge(false)} />
            )}

            <BACGauge bac={bac} />

            <View style={shS.statsRow}>
              <StatBox label={"DRINKS\nLOGGED"} value={String(drinks.length)} />
              <View style={{ width: 8 }} />
              <StatBox
                label={"STANDARD\nDRINKS"}
                value={totalStd.toFixed(1)}
                color={C.orange}
              />
              <View style={{ width: 8 }} />
              <StatBox
                label={"SOBER\nIN"}
                value={fmtSober(bac)}
                color={status.color}
              />
            </View>

            <Divider label="LOG A DRINK" />

            <View style={shS.grid}>
              {drinkOptions.map((dt) => (
                <TouchableOpacity
                  key={dt.id ?? dt.label}
                  style={shS.drinkBtn}
                  onPress={() => verifyAndAddDrink(dt)}
                  activeOpacity={verifying ? 1 : 0.65}
                  disabled={verifying}
                >
                  <Text style={shS.drinkEmoji}>{dt.emoji}</Text>
                  <Text style={shS.drinkName} numberOfLines={2}>{dt.label}</Text>
                  <Text style={shS.drinkAbv}>{dt.abv}% ABV</Text>
                </TouchableOpacity>
              ))}
            </View>

            {drinks.length > 0 && (
              <TouchableOpacity
                style={[shS.verifyBtn, verifying && shS.verifyBtnDisabled]}
                onPress={() => promptVerifyDrink()}
                disabled={verifying}
                activeOpacity={0.8}
              >
                <Text style={shS.verifyBtnTxt}>
                  📷 TAKE PHOTO — VERIFY DRINK
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={shS.alertBtn}
              onPress={sendAlert}
              activeOpacity={0.8}
            >
              <Text style={shS.alertBtnTxt}>📍 ALERT MY FRIENDS</Text>
            </TouchableOpacity>

            {drinks.length > 0 && (
              <>
                <Divider label="TONIGHT'S LOG" />
                {drinks.map((e) => (
                  <DrinkLogItem
                    key={e.id}
                    entry={e}
                    onRemove={() => removeDrink(e.id)}
                  />
                ))}
              </>
            )}

            {drinks.length === 0 && (
              <View style={shS.empty}>
                <Text style={shS.emptyDash}>—</Text>
                <Text style={shS.emptyTitle}>NO DRINKS LOGGED</Text>
                <Text style={shS.emptySub}>
                  Tap a drink above to start tracking.
                </Text>
              </View>
            )}

            <Text style={shS.disclaimer}>
              BAC IS AN ESTIMATE (WIDMARK FORMULA). NEVER DRIVE IMPAIRED.
            </Text>
            <View style={{ height: 48 }} />
          </ScrollView>
        </Animated.View>
      </Modal>
    </View>
  );
}

// ─── FAB styles ───────────────────────────────────────────────────────────────
const fabS = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 100, // clears 4-tab bar + safe area
    right: 20,
    zIndex: 999,
  },
  btn: {
    width: 64,
    height: 64,
    borderRadius: 2, // square-ish, fits grunge aesthetic
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  icon: { fontSize: 22, marginBottom: 2 },
  label: {
    color: "#F0EBE1",
    fontSize: 7,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontWeight: "900",
    letterSpacing: 2,
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#F0EBE1",
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#C8321A",
    zIndex: 1,
  },
  badgeTxt: {
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});

// ─── Sheet styles ─────────────────────────────────────────────────────────────
const shS = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  verifyingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  verifyingTxt: {
    color: C.orange,
    fontSize: 11,
    fontFamily: MONO,
    fontWeight: "900",
    letterSpacing: 2,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0E0B09",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderTopWidth: 2,
    borderTopColor: "#C8321A",
    maxHeight: "90%",
  },
  handleRow: { alignItems: "center", paddingTop: 10, paddingBottom: 2 },
  handle: {
    width: 36,
    height: 3,
    backgroundColor: "#2C2520",
    borderRadius: 2,
    marginBottom: 4,
  },
  handleHint: {
    color: "#2C2520",
    fontSize: 8,
    fontFamily: "Courier New",
    letterSpacing: 2,
    paddingBottom: 4,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2520",
  },
  eyebrow: {
    color: "#6B5E52",
    fontSize: 9,
    fontFamily: MONO,
    letterSpacing: 2,
    marginBottom: 3,
  },
  title: {
    color: "#F0EBE1",
    fontSize: 20,
    fontFamily: MONO,
    fontWeight: "900",
    letterSpacing: 3,
  },
  titleSub: {
    color: "#6B5E52",
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: "400",
  },
  verifyStatus: {
    color: "#D4622A",
    fontSize: 8,
    fontFamily: MONO,
    letterSpacing: 1.5,
    marginTop: 6,
  },
  endBtn: {
    borderWidth: 1.5,
    borderColor: "#2C2520",
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  endBtnTxt: {
    color: "#6B5E52",
    fontSize: 10,
    fontFamily: MONO,
    letterSpacing: 3,
    fontWeight: "900",
  },

  ticker: {
    backgroundColor: "#C8321A",
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  tickerTxt: {
    color: "#F0EBE1",
    fontSize: 9,
    fontFamily: MONO,
    letterSpacing: 1.5,
    fontWeight: "700",
  },

  scroll: { flex: 1 },
  content: { padding: 14 },

  statsRow: { flexDirection: "row", marginBottom: 4 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  drinkBtn: {
    width: (SW - 52) / 3,
    backgroundColor: "#161210",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#2C2520",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  drinkEmoji: { fontSize: 24, marginBottom: 5 },
  drinkName: {
    color: "#F0EBE1",
    fontSize: 9,
    fontFamily: MONO,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  drinkAbv: {
    color: "#6B5E52",
    fontSize: 8,
    fontFamily: MONO,
    letterSpacing: 1,
    marginTop: 3,
  },

  alertBtn: {
    backgroundColor: "#161210",
    borderWidth: 1.5,
    borderColor: "#D4622A",
    borderRadius: 2,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 4,
  },
  alertBtnTxt: {
    color: "#D4622A",
    fontSize: 12,
    fontFamily: MONO,
    fontWeight: "900",
    letterSpacing: 2.5,
  },

  verifyBtn: {
    backgroundColor: "#161210",
    borderWidth: 1.5,
    borderColor: "#D4622A",
    borderRadius: 2,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  verifyBtnTxt: {
    color: "#D4622A",
    fontSize: 11,
    fontFamily: MONO,
    fontWeight: "900",
    letterSpacing: 2,
  },
  verifyBtnDisabled: { opacity: 0.5 },

  empty: { alignItems: "center", paddingVertical: 28 },
  emptyDash: { color: "#2C2520", fontSize: 32, marginBottom: 10 },
  emptyTitle: {
    color: "#6B5E52",
    fontSize: 13,
    fontFamily: MONO,
    fontWeight: "900",
    letterSpacing: 3,
  },
  emptySub: {
    color: "#2C2520",
    fontSize: 10,
    fontFamily: MONO,
    letterSpacing: 1,
    marginTop: 6,
  },

  disclaimer: {
    color: "#2C2520",
    fontSize: 8,
    fontFamily: MONO,
    textAlign: "center",
    lineHeight: 13,
    letterSpacing: 1.5,
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
