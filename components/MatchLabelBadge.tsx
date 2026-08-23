import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, type, formatMatchLabel } from "./theme";
import type { MatchLabel } from "../types/realitylens";

type Props = {
  label?: MatchLabel | string | null;
};

export function MatchLabelBadge({ label }: Props) {
  if (!label) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{formatMatchLabel(label)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
