// @ts-nocheck
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { colors } from "../components/theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SystemUI.setBackgroundColorAsync(colors.canvas).catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.canvas },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700", fontFamily: "Inter_700Bold" },
          headerShadowVisible: false,
          headerBackTitleVisible: false,
          contentStyle: { backgroundColor: colors.canvas },
          animation: "fade_from_bottom",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="index"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="searching"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen name="scan/[id]" options={{ title: "Match" }} />
        <Stack.Screen name="try-on/[id]" options={{ title: "Try On" }} />
        <Stack.Screen
          name="result/[id]"
          options={{ title: "Reveal", headerShown: false }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
