// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "../../components/GlassCard";
import { InfoCard } from "../../components/InfoCard";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { ScreenShell } from "../../components/ScreenShell";
import { useTheme } from "../../components/ThemeProvider";
import { radii, spacing, type, type ThemeColors } from "../../components/theme";

const appLogo = require("../../assets/logo.png");
const demoShoe = require("../../assets/demo/shoes.jpg");
const demoSelfie = require("../../assets/demo/selfie.jpg");

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

const STEPS = [
  { icon: "camera-outline" as const, label: "Scan" },
  { icon: "search-outline" as const, label: "Match" },
  { icon: "shirt-outline" as const, label: "Try on" },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScreenShell scroll contentStyle={{ paddingTop: insets.top + spacing.lg }}>
      <View style={styles.brandRow}>
        <Image source={appLogo} style={styles.brandLogo} />
        <Text style={styles.kicker}>RealityLens</Text>
      </View>
      <ScreenHeader title="Scan anything. Try it on." />

      <View style={styles.showcase}>
        <Image source={demoShoe} style={styles.showcaseImage} resizeMode="cover" />
        <Image source={demoSelfie} style={styles.showcaseImage} resizeMode="cover" />
        <View style={styles.showcaseOverlay}>
          <View style={styles.showcaseBadge}>
            <Ionicons name="sparkles" size={14} color={colors.accent} />
            <Text style={styles.showcaseBadgeText}>Live try-on</Text>
          </View>
        </View>
      </View>

      <GlassCard style={styles.heroCard}>
        <Text style={styles.heroTitle}>Start scanning</Text>
        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={step.label} style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Ionicons name={step.icon} size={18} color={colors.accent} />
              </View>
              <Text style={styles.stepLabel}>{step.label}</Text>
              {i < STEPS.length - 1 ? (
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.textDim}
                  style={styles.stepChevron}
                />
              ) : null}
            </View>
          ))}
        </View>
        <PrimaryButton
          icon="camera-outline"
          label="Open camera"
          onPress={() => router.push("/(tabs)/camera")}
          style={styles.heroBtn}
        />
      </GlassCard>

      <Text style={styles.sectionTitle}>Tips for best results</Text>
      <View style={styles.tips}>
        {TIPS.map((tip) => (
          <InfoCard
            key={tip.title}
            icon={tip.icon}
            title={tip.title}
            description={tip.copy}
          />
        ))}
      </View>
    </ScreenShell>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    brandLogo: {
      width: 36,
      height: 36,
      borderRadius: radii.sm,
    },
    kicker: {
      ...type.label,
      color: colors.accent,
      textTransform: "uppercase",
      marginBottom: 0,
    },
    showcase: {
      flexDirection: "row",
      height: 160,
      borderRadius: radii.xl,
      overflow: "hidden",
      marginBottom: spacing.lg,
      gap: 3,
      backgroundColor: colors.surface,
    },
    showcaseImage: {
      flex: 1,
      height: "100%",
    },
    showcaseOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "flex-end",
      padding: spacing.md,
    },
    showcaseBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
    },
    showcaseBadgeText: {
      ...type.label,
      color: "#FFFFFF",
      textTransform: "none",
      letterSpacing: 0,
    },
    heroCard: {
      marginBottom: spacing.xxl,
      gap: spacing.md,
    },
    heroTitle: {
      ...type.title,
      fontSize: 20,
      color: colors.text,
    },
    steps: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.xs,
    },
    stepItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    stepIcon: {
      width: 32,
      height: 32,
      borderRadius: radii.sm,
      backgroundColor: colors.accentMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    stepLabel: {
      ...type.caption,
      color: colors.textMuted,
      fontWeight: "600",
    },
    stepChevron: {
      marginLeft: spacing.xs,
    },
    heroBtn: {
      marginTop: spacing.xs,
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
  });
}
