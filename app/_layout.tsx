// app/_layout.tsx

import {
  InstrumentSerif_400Regular,
  useFonts,
} from "@expo-google-fonts/instrument-serif";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import DrinkTrackerFAB from "@/components/DrinkTrackerFAB";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Hold the splash screen until fonts are ready
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    "InstrumentSerif-Regular": InstrumentSerif_400Regular,
  });

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    // Small delay so native splash is registered before we hide it
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {
        // Ignore "no native splash registered" on some iOS view controllers
      });
    }, 100);
    return () => clearTimeout(t);
  }, [fontsLoaded, fontError]);

  // Don't render the app until fonts are ready
  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <DrinkTrackerFAB>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
          <Stack.Screen name="register" options={{ headerShown: false }} />
        </Stack>
      </DrinkTrackerFAB>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
