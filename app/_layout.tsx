// @ts-nocheck
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#111111" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: "700" as const },
          contentStyle: { backgroundColor: "#111111" } as object,
        }}
      >
        <Stack.Screen name="index" options={{ title: "RealityLens" }} />
        <Stack.Screen name="scan/[id]" options={{ title: "Match" }} />
        <Stack.Screen name="try-on/[id]" options={{ title: "Try On" }} />
        <Stack.Screen name="result/[id]" options={{ title: "Result" }} />
      </Stack>
    </>
  );
}
