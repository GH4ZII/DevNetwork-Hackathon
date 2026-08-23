// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "../../components/GlassCard";
import { ScreenHeader } from "../../components/ScreenHeader";
import { ScreenShell } from "../../components/ScreenShell";
import { colors, radii, spacing, type } from "../../components/theme";

const SETTINGS = [
  { icon: "notifications-outline" as const, label: "Notifications", value: "Off" },
  { icon: "flask-outline" as const, label: "Demo mode", value: "Available" },
  { icon: "information-circle-outline" as const, label: "About RealityLens", value: "" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? "0.1.0";

  return (
    <ScreenShell scroll contentStyle={{ paddingTop: insets.top + spacing.lg }}>
      <ScreenHeader title="Profile" subtitle="Your RealityLens account" />

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>RL</Text>
        </View>
        <Text style={styles.name}>Guest</Text>
        <Text style={styles.email}>Sign in coming soon</Text>
      </View>

      <View style={styles.settings}>
        {SETTINGS.map((item) => (
          <GlassCard key={item.label} style={styles.settingRow} padded={false}>
            <View style={styles.settingInner}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons name={item.icon} size={20} color={colors.text} />
                </View>
                <Text style={styles.settingLabel}>{item.label}</Text>
              </View>
              {item.value ? (
                <Text style={styles.settingValue}>{item.value}</Text>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
              )}
            </View>
          </GlassCard>
        ))}
      </View>

      <Text style={styles.version}>RealityLens v{version}</Text>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: "center",
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.accentMuted,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  avatarText: {
    ...type.title,
    color: colors.accent,
    fontSize: 28,
  },
  name: {
    ...type.title,
    fontSize: 20,
    color: colors.text,
  },
  email: {
    ...type.body,
    color: colors.textMuted,
  },
  settings: {
    gap: spacing.md,
  },
  settingRow: {
    overflow: "hidden",
  },
  settingInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    ...type.subtitle,
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
  },
  settingValue: {
    ...type.caption,
    color: colors.textDim,
  },
  version: {
    ...type.caption,
    color: colors.textDim,
    textAlign: "center",
    marginTop: spacing.xxxl,
  },
});
