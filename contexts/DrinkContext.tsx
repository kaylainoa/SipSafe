/**
 * Shared drink state so Home EST. BAC and DrinkTrackerFAB stay in sync.
 * When a drink is logged (from Home modal or FAB), both see the same drinks and BAC.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const WIDMARK_R = { male: 0.73, female: 0.66 };

export interface DrinkEntry {
  id: string;
  type: string;
  emoji: string;
  standardDrinks: number;
  timestamp: Date;
}

export type BACProfile = { weightLbs: number; gender: "male" | "female" };

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

const DEFAULT_PROFILE: BACProfile = { weightLbs: 130, gender: "female" };

interface DrinkContextValue {
  bac: number;
  drinks: DrinkEntry[];
  addDrink: (entry: DrinkEntry) => void;
  removeDrink: (id: string) => void;
  clearDrinks: () => void;
}

const DrinkContext = createContext<DrinkContextValue>({
  bac: 0,
  drinks: [],
  addDrink: () => {},
  removeDrink: () => {},
  clearDrinks: () => {},
});

export function DrinkProvider({ children }: { children: React.ReactNode }) {
  const [drinks, setDrinks] = useState<DrinkEntry[]>([]);
  const [profile, setProfile] = useState<BACProfile>(DEFAULT_PROFILE);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        if (raw) {
          const user = JSON.parse(raw);
          const p = user?.profile;
          if (p && typeof p.weightLbs === "number") {
            setProfile({ weightLbs: p.weightLbs, gender: p.gender === "male" ? "male" : "female" });
          }
        }
      } catch {}
    })();
  }, []);

  const bac = calcBAC(drinks, profile);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const addDrink = useCallback((entry: DrinkEntry) => {
    setDrinks((prev) => [entry, ...prev]);
  }, []);

  const removeDrink = useCallback((id: string) => {
    setDrinks((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const clearDrinks = useCallback(() => {
    setDrinks([]);
  }, []);

  return (
    <DrinkContext.Provider
      value={{ bac, drinks, addDrink, removeDrink, clearDrinks }}
    >
      {children}
    </DrinkContext.Provider>
  );
}

export function useDrinkContext() {
  return useContext(DrinkContext);
}

export default DrinkContext;
