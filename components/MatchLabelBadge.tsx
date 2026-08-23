import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "./ThemeProvider";
import { radii, spacing, type, formatMatchLabel, type ThemeColors } from "./theme";
import type { MatchLabel } from "../types/realitylens";

type Props = {
  label?: MatchLabel | string | null;
};

export function MatchLabelBadge({ label }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!label) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{formatMatchLabel(label)}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    badge: {
      alignSelf: "flex-start",
      backgroundColor: colors.accentMuted,
      borderWidth: 1,
      borderColor: colors.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radii.full,
    },
    text: {
      ...type.label,
      color: colors.accent,
      textTransform: "uppercase",
    },
  });
}
