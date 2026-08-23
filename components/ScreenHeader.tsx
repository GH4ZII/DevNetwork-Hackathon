import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, type } from "./theme";

type Props = {
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  title: {
    ...type.hero,
    fontSize: 28,
    color: colors.text,
  },
  subtitle: {
    ...type.body,
    color: colors.textMuted,
  },
});
