import { useMemo } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { lightImpact } from "../lib/haptics";
import { useTheme } from "./ThemeProvider";
import { radii, shadows, spacing, type, type ThemeColors } from "./theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  compact?: boolean;
};

export function GlassButton({ label, onPress, disabled, style, compact }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={() => {
        lightImpact();
        onPress();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    button: {
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      borderRadius: radii.lg,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
      ...shadows.card,
    },
    compact: {
      minHeight: 44,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    disabled: { opacity: 0.45 },
    label: {
      ...type.subtitle,
      color: colors.text,
      fontWeight: "600",
    },
  });
}
