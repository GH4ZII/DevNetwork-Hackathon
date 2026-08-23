// @ts-nocheck
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors } from "../components/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.canvas },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ headerShown: false, title: "Scan" }}
        />
        <Stack.Screen
          name="searching"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen name="scan/[id]" options={{ title: "Match" }} />
        <Stack.Screen name="try-on/[id]" options={{ title: "Try On" }} />
        <Stack.Screen
          name="result/[id]"
          options={{ title: "Reveal", headerTransparent: true, headerTitle: "" }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
