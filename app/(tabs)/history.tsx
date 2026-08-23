// @ts-nocheck
import { useRouter } from "expo-router";
import { EmptyState } from "../../components/EmptyState";
import { ScreenShell } from "../../components/ScreenShell";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../../components/theme";

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScreenShell contentStyle={{ paddingTop: insets.top + spacing.lg }}>
      <EmptyState
        icon="time-outline"
        title="No scans yet"
        description="Your scan history will appear here once you start exploring products."
        actionLabel="Scan your first item"
        onAction={() => router.push("/(tabs)/camera")}
      />
    </ScreenShell>
  );
}
