import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { GlassButton } from "./GlassButton";
import { PrimaryButton } from "./PrimaryButton";
import { colors, radii, spacing, type } from "./theme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconRing}>
        <Ionicons name={icon} size={32} color={colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} style={styles.btn} />
      ) : null}
      {secondaryLabel && onSecondary ? (
        <GlassButton label={secondaryLabel} onPress={onSecondary} style={styles.btn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.canvas,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: {
    ...type.title,
    fontSize: 20,
    color: colors.text,
    textAlign: "center",
  },
  description: {
    ...type.body,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 280,
  },
  btn: {
    width: "100%",
    marginTop: spacing.sm,
  },
});
