import { api } from "@/constants/api";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type LogEntry = {
  drinkName: string;
  estimatedBacContribution: number;
  createdAt: string;
};

type ReceiptRow = { item: string; qty: number; bac: number };

function getYesterdayStartEnd(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    0,
    0,
    0,
    0,
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

function buildReceiptRows(logs: LogEntry[]): ReceiptRow[] {
  const byName = new Map<string, { count: number; bacSum: number }>();
  for (const log of logs) {
    const name = log.drinkName || "Drink";
    const cur = byName.get(name) ?? { count: 0, bacSum: 0 };
    cur.count += 1;
    cur.bacSum += log.estimatedBacContribution ?? 0;
    byName.set(name, cur);
  }
  return Array.from(byName.entries()).map(([item, { count, bacSum }]) => ({
    item,
    qty: count,
    bac: bacSum,
  }));
}

interface JaggedEdgeProps {
  position: "top" | "bottom";
}

const JaggedEdge = ({ position }: JaggedEdgeProps) => (
  <View
    style={[
      styles.jaggedContainer,
      position === "top" ? styles.topJagged : styles.bottomJagged,
    ]}
  >
    {[...Array(40)].map((_, i) => (
      <View key={i} style={styles.tooth} />
    ))}
  </View>
);

export default function NightReceipt() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadYesterday = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = (await api.getLogs({ limit: 200 })) as LogEntry[];
      const list = Array.isArray(raw) ? raw : [];
      const { start, end } = getYesterdayStartEnd();
      const yesterdayLogs = list.filter((l) => {
        const t = new Date(l.createdAt).getTime();
        return t >= start.getTime() && t <= end.getTime();
      });
      setLogs(yesterdayLogs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load receipt");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadYesterday();
  }, [loadYesterday]);

  const rows = buildReceiptRows(logs);
  const totalDrinks = logs.length;
  const peakBac = logs.reduce(
    (s, l) => s + (l.estimatedBacContribution ?? 0),
    0,
  );
  const { start: yesterday } = getYesterdayStartEnd();
  const serial = `#${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.headerNav}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtnContainer}
        >
          <Text style={styles.closeX}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>LAST NIGHT&apos;S POUR DECISIONS</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.receiptContainer}>
        <View style={styles.receiptPaper}>
          <JaggedEdge position="top" />

          <View style={styles.innerContent}>
            <Image
              source={require("@/assets/images/logo-sipsafe-receipt.png")}
              style={styles.brandLogo}
              resizeMode="contain"
              accessibilityLabel="SipSafe"
            />

            <View style={styles.dottedDivider} />

            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.tableHeaderItem]}>
                ITEM
              </Text>
              <Text style={[styles.tableHeaderText, styles.tableHeaderQty]}>
                QTY
              </Text>
              <Text style={[styles.tableHeaderText, styles.tableHeaderBac]}>
                BAC
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : rows.length === 0 ? (
              <Text style={styles.emptyText}>
                No drinks logged for yesterday.
              </Text>
            ) : (
              <>
                {rows.map((r, i) => (
                  <View key={`${r.item}-${i}`} style={styles.itemRow}>
                    <Text style={styles.itemMain} numberOfLines={2}>
                      {r.item}
                    </Text>
                    <Text style={styles.itemQty}>
                      {String(r.qty).padStart(2, "0")}
                    </Text>
                    <Text style={styles.itemBac}>
                      {r.bac.toFixed(3).replace(/^0/, "")}
                    </Text>
                  </View>
                ))}

                <View style={styles.dottedDivider} />

                <View style={styles.totalBlock}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL DRINKS</Text>
                    <Text style={styles.totalValue}>
                      {String(totalDrinks).padStart(2, "0")}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>PEAK ESTIMATE</Text>
                    <Text style={styles.totalValue}>{peakBac.toFixed(3)}%</Text>
                  </View>
                </View>

                <View style={styles.dottedDivider} />

                <View style={styles.barcodeArea}>
                  <Text style={styles.serialNumber}>{serial}</Text>
                </View>
              </>
            )}

            <View style={{ marginBottom: 40 }} />
          </View>

          <JaggedEdge position="bottom" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scrollContent: { paddingTop: 50, paddingBottom: 80, flexGrow: 0 },
  headerNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 36,
    marginBottom: 30,
  },
  closeBtnContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  closeX: { color: "#fff", fontSize: 28, fontWeight: "300" },
  navTitle: {
    color: "#fff",
    fontFamily: "BebasNeue",
    fontSize: 25,
    letterSpacing: 1,
    textAlign: "center",
    flex: 1,
  },
  receiptContainer: { paddingHorizontal: 30, width: "100%" },
  receiptPaper: {
    backgroundColor: "#D2C9B1",
    width: "100%",
    alignSelf: "stretch",
    shadowColor: "#fff",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 10,
    overflow: "hidden",
  },
  innerContent: {
    paddingHorizontal: 25,
    alignItems: "center",
    paddingTop: 20,
    width: "100%",
    flexShrink: 0,
  },
  brandLogo: {
    width: 400,
    height: 160,
    marginBottom: 2,
  },
  dottedDivider: {
    width: "100%",
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    borderStyle: "dashed",
    marginVertical: 12,
  },
  tableHeader: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  tableHeaderText: { fontFamily: "Courier", fontWeight: "bold", fontSize: 12 },
  tableHeaderItem: { flex: 2, paddingRight: 8 },
  tableHeaderQty: { flex: 0, minWidth: 28, textAlign: "center" },
  tableHeaderBac: { flex: 0, minWidth: 36, textAlign: "right" },
  itemRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    minHeight: 20,
  },
  itemMain: {
    fontFamily: "Courier",
    fontSize: 13,
    flex: 2,
    flexShrink: 1,
    paddingRight: 8,
  },
  itemQty: {
    fontFamily: "Courier",
    fontSize: 13,
    flex: 0,
    minWidth: 28,
    textAlign: "center",
  },
  itemBac: {
    fontFamily: "Courier",
    fontSize: 13,
    flex: 0,
    minWidth: 36,
    textAlign: "right",
  },
  totalBlock: { width: "100%" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  totalLabel: { fontFamily: "RubikBold", fontSize: 14 },
  totalValue: { fontFamily: "Courier", fontSize: 16, fontWeight: "bold" },
  barcodeArea: { marginTop: 30, alignItems: "center", width: "100%" },
  serialNumber: { fontFamily: "Courier", fontSize: 10, letterSpacing: 3 },
  loadingBlock: { paddingVertical: 24, alignItems: "center" },
  loadingText: { fontFamily: "Courier", fontSize: 12, marginTop: 8 },
  errorText: {
    fontFamily: "Courier",
    fontSize: 12,
    color: "#c00",
    textAlign: "center",
  },
  emptyText: {
    fontFamily: "Courier",
    fontSize: 12,
    color: "#444",
    textAlign: "center",
  },

  jaggedContainer: {
    flexDirection: "row",
    width: "100%",
    height: 12,
    justifyContent: "center",
    zIndex: 1,
  },
  topJagged: { marginTop: -7 },
  bottomJagged: { marginBottom: -7 },
  tooth: {
    width: 12,
    height: 12,
    backgroundColor: "#000",
    transform: [{ rotate: "45deg" }],
    marginHorizontal: -1,
  },
});
