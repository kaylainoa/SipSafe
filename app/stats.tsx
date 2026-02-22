import { api } from "@/constants/api";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const THEME = "#ff4000";
const RANGES = [
  { key: "1d", label: "1 Day" },
  { key: "1w", label: "1 Week" },
  { key: "1m", label: "1 Month" },
  { key: "1y", label: "1 Year" },
  { key: "all", label: "All Time" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

interface Bucket {
  label: string;
  date: string;
  count: number;
  pureAlcoholMl: number;
}

interface Analytics {
  buckets: Bucket[];
  totals: { totalDrinks: number; totalPureAlcoholMl: number };
  trends: {
    consumptionDirection: "up" | "down" | "same";
    currentPeriodDrinks: number;
    previousPeriodDrinks: number;
    avgHoursBetweenDrinks: number;
    longestGapHours: number;
  };
}

const CHART_HEIGHT = 160;

type LogEntry = { createdAt: string; pureAlcoholMl?: number };

function buildAnalyticsFromLogs(logs: LogEntry[], r: RangeKey): Analytics {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  let startDate: Date;
  if (r === "1d") startDate = new Date(now.getTime() - dayMs);
  else if (r === "1w") startDate = new Date(now.getTime() - 7 * dayMs);
  else if (r === "1m") startDate = new Date(now.getTime() - 30 * dayMs);
  else if (r === "1y") startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  else startDate = new Date(0);

  const inRange = logs.filter((l) => new Date(l.createdAt) >= startDate);
  const bucketMap = new Map<string, { count: number; pureAlcoholMl: number; label: string }>();

  if (r === "1d") {
    for (let h = 0; h < 24; h++) bucketMap.set(`${h}`, { count: 0, pureAlcoholMl: 0, label: `${h}:00` });
    inRange.forEach((l) => {
      const h = new Date(l.createdAt).getHours();
      const b = bucketMap.get(`${h}`);
      if (b) {
        b.count += 1;
        b.pureAlcoholMl += l.pureAlcoholMl ?? 0;
      }
    });
  } else if (r === "1y" || r === "all") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      bucketMap.set(key, { count: 0, pureAlcoholMl: 0, label: d.toLocaleDateString("default", { month: "short", year: "2-digit" }) });
    }
    inRange.forEach((l) => {
      const d = new Date(l.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const b = bucketMap.get(key);
      if (b) {
        b.count += 1;
        b.pureAlcoholMl += l.pureAlcoholMl ?? 0;
      }
    });
  } else {
    const cursor = new Date(startDate);
    const end = new Date(now.getTime() + dayMs);
    while (cursor < end) {
      const key = cursor.toISOString().slice(0, 10);
      bucketMap.set(key, { count: 0, pureAlcoholMl: 0, label: cursor.toLocaleDateString("default", { weekday: "short" }) });
      cursor.setDate(cursor.getDate() + 1);
    }
    inRange.forEach((l) => {
      const key = new Date(l.createdAt).toISOString().slice(0, 10);
      const b = bucketMap.get(key);
      if (b) {
        b.count += 1;
        b.pureAlcoholMl += l.pureAlcoholMl ?? 0;
      }
    });
  }

  const buckets: Bucket[] = Array.from(bucketMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ label: v.label, date, count: v.count, pureAlcoholMl: v.pureAlcoholMl }));

  const totalDrinks = inRange.length;
  const totalPureAlcoholMl = inRange.reduce((s, l) => s + (l.pureAlcoholMl ?? 0), 0);

  const sortedTimes = inRange.map((l) => new Date(l.createdAt).getTime()).sort((a, b) => a - b);
  let avgHoursBetween = 0;
  let longestGapHours = 0;
  if (sortedTimes.length >= 2) {
    const gaps = [];
    for (let i = 1; i < sortedTimes.length; i++) gaps.push((sortedTimes[i] - sortedTimes[i - 1]) / (60 * 60 * 1000));
    avgHoursBetween = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    longestGapHours = Math.max(...gaps);
  }

  const periodMs = now.getTime() - startDate.getTime();
  const previousStart = new Date(startDate.getTime() - periodMs);
  const previousCount = logs.filter((l) => {
    const t = new Date(l.createdAt).getTime();
    return t >= previousStart.getTime() && t < startDate.getTime();
  }).length;

  let consumptionDirection: "up" | "down" | "same" = "same";
  if (totalDrinks > previousCount) consumptionDirection = "up";
  else if (totalDrinks < previousCount) consumptionDirection = "down";

  return {
    buckets,
    totals: { totalDrinks, totalPureAlcoholMl },
    trends: {
      consumptionDirection,
      currentPeriodDrinks: totalDrinks,
      previousPeriodDrinks: previousCount,
      avgHoursBetweenDrinks: Math.round(avgHoursBetween * 10) / 10,
      longestGapHours: Math.round(longestGapHours * 10) / 10,
    },
  };
}

export default function StatsScreen() {
  const router = useRouter();
  const [range, setRange] = useState<RangeKey>("1w");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (r: RangeKey) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getConsumptionAnalytics(r);
      setData(res as Analytics);
    } catch (e) {
      try {
        const logs = (await api.getLogs({ limit: 500 })) as LogEntry[];
        const built = buildAnalyticsFromLogs(Array.isArray(logs) ? logs : [], r);
        setData(built);
      } catch (fallbackErr) {
        setError(e instanceof Error ? e.message : "Failed to load data");
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  const maxCount = data?.buckets?.length
    ? Math.max(1, ...data.buckets.map((b) => b.count))
    : 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Consumption</Text>
      </View>

      <View style={styles.filterRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.filterPill, range === r.key && styles.filterPillActive]}
            onPress={() => setRange(r.key)}
          >
            <Text
              style={[
                styles.filterPillText,
                range === r.key && styles.filterPillTextActive,
              ]}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={THEME} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {data && data.buckets.length > 0 ? (
            <>
              <View style={styles.chartCard}>
                <Text style={styles.cardTitle}>Consumption</Text>
                <View style={styles.chartContainer}>
                  {data.buckets.map((b, i) => (
                    <View key={`${b.date}-${i}`} style={styles.barColumn}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height:
                              (b.count / maxCount) * CHART_HEIGHT || 4,
                          },
                        ]}
                      />
                      <Text style={styles.barLabel} numberOfLines={1}>
                        {b.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{data.totals.totalDrinks}</Text>
                  <Text style={styles.statLabel}>Total drinks</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {data.totals.totalPureAlcoholMl.toFixed(0)} ml
                  </Text>
                  <Text style={styles.statLabel}>Pure alcohol</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Trends</Text>
              <View style={styles.trendCard}>
                <Text style={styles.trendLabel}>Consumption vs previous period</Text>
                <Text
                  style={[
                    styles.trendValue,
                    data.trends.consumptionDirection === "up" && styles.trendUp,
                    data.trends.consumptionDirection === "down" && styles.trendDown,
                  ]}
                >
                  {data.trends.consumptionDirection === "up" && "↑ Up"}
                  {data.trends.consumptionDirection === "down" && "↓ Down"}
                  {data.trends.consumptionDirection === "same" && "→ Same"}
                </Text>
                <Text style={styles.trendSub}>
                  {data.trends.currentPeriodDrinks} drinks now vs{" "}
                  {data.trends.previousPeriodDrinks} previous period
                </Text>
              </View>
              <View style={styles.trendCard}>
                <Text style={styles.trendLabel}>Avg. time between drinks</Text>
                <Text style={styles.trendValue}>
                  {data.trends.avgHoursBetweenDrinks.toFixed(1)} hrs
                </Text>
              </View>
              <View style={styles.trendCard}>
                <Text style={styles.trendLabel}>Longest gap between drinks</Text>
                <Text style={styles.trendValue}>
                  {data.trends.longestGapHours.toFixed(1)} hrs
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No consumption data for this period.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  backBtn: { marginRight: 16 },
  backText: { color: THEME, fontSize: 16 },
  title: { color: "#fff", fontSize: 24, fontWeight: "700" },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "#333",
  },
  filterPillActive: { backgroundColor: THEME, borderColor: THEME },
  filterPillText: { color: "#999", fontSize: 13 },
  filterPillTextActive: { color: "#fff", fontWeight: "600" },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },

  chartCard: {
    backgroundColor: "rgba(20,20,20,0.9)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  cardTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 16 },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: CHART_HEIGHT + 28,
  },
  barColumn: { flex: 1, alignItems: "center", marginHorizontal: 2 },
  bar: {
    width: "80%",
    minHeight: 4,
    backgroundColor: THEME,
    borderRadius: 2,
    marginBottom: 6,
  },
  barLabel: { color: "#888", fontSize: 9, maxWidth: 36, textAlign: "center" },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(20,20,20,0.9)",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "800" },
  statLabel: { color: "#888", fontSize: 12, marginTop: 4 },

  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 },
  trendCard: {
    backgroundColor: "rgba(20,20,20,0.9)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  trendLabel: { color: "#888", fontSize: 12 },
  trendValue: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 4 },
  trendUp: { color: "#ff6b6b" },
  trendDown: { color: "#51cf66" },
  trendSub: { color: "#666", fontSize: 11, marginTop: 4 },

  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  loadingText: { color: "#888", marginTop: 12 },
  errorText: { color: "#ff6b6b", textAlign: "center" },
  emptyText: { color: "#888", textAlign: "center" },
});
