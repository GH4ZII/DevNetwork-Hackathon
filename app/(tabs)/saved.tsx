// @ts-nocheck
import { useRouter } from "expo-router";
import { EmptyState } from "../../components/EmptyState";
import { ScreenShell } from "../../components/ScreenShell";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../../components/theme";

export default function SavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScreenShell contentStyle={{ paddingTop: insets.top + spacing.lg }}>
      <EmptyState
        icon="bookmark-outline"
        title="Nothing saved yet"
        description="Save products and try-on results here to revisit them later."
        actionLabel="Start scanning"
        onAction={() => router.push("/(tabs)/camera")}
      />
    </ScreenShell>
  );
}
