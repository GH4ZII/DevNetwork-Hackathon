import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { lightImpact } from "../lib/haptics";
import { colors, radii, spacing, type } from "./theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  compact?: boolean;
};

export function GlassButton({ label, onPress, disabled, style, compact }: Props) {
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

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
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
