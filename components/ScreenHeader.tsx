import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "./ThemeProvider";
import { spacing, type, type ThemeColors } from "./theme";

type Props = {
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ title, subtitle }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
}
