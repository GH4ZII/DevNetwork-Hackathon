// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "../../components/GlassCard";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { ScreenShell } from "../../components/ScreenShell";
import { colors, radii, spacing, type } from "../../components/theme";

const TIPS = [
  {
    icon: "sunny-outline" as const,
    title: "Good lighting",
    copy: "Bright, even light helps us match products faster.",
  },
  {
    icon: "scan-outline" as const,
    title: "Center the product",
    copy: "Fill the frame with the item you want to find.",
  },
  {
    icon: "hand-left-outline" as const,
    title: "Hold steady",
    copy: "Keep your phone still for a sharper scan.",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScreenShell scroll contentStyle={{ paddingTop: insets.top + spacing.lg }}>
      <Text style={styles.kicker}>RealityLens</Text>
      <ScreenHeader
        title="Scan anything. Try it on."
        subtitle="Point your camera at any product and see it on you in seconds."
      />

      <GlassCard style={styles.heroCard}>
        <Text style={styles.heroTitle}>Start scanning</Text>
        <Text style={styles.heroCopy}>
          Find products online and preview them with virtual try-on.
        </Text>
        <PrimaryButton
          label="Open camera"
          onPress={() => router.push("/(tabs)/camera")}
          style={styles.heroBtn}
        />
      </GlassCard>

      <Text style={styles.sectionTitle}>Tips for best results</Text>
      <View style={styles.tips}>
        {TIPS.map((tip) => (
          <GlassCard key={tip.title} style={styles.tipCard}>
            <View style={styles.tipRow}>
              <View style={styles.tipIcon}>
                <Ionicons name={tip.icon} size={20} color={colors.text} />
              </View>
              <View style={styles.tipBody}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipCopy}>{tip.copy}</Text>
              </View>
            </View>
          </GlassCard>
        ))}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  kicker: {
    ...type.label,
    color: colors.accent,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  heroCard: {
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  heroTitle: {
    ...type.title,
    fontSize: 20,
    color: colors.text,
  },
  heroCopy: {
    ...type.body,
    color: colors.textMuted,
  },
  heroBtn: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...type.subtitle,
    color: colors.text,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  tips: {
    gap: spacing.md,
  },
  tipCard: {
    padding: spacing.md,
  },
  tipRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  tipBody: {
    flex: 1,
    gap: 2,
  },
  tipTitle: {
    ...type.subtitle,
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
  },
  tipCopy: {
    ...type.caption,
    color: colors.textMuted,
  },
});
