import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { lightImpact } from "../lib/haptics";
import { colors, radii, shadows, spacing, type } from "./theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, disabled, loading, style }: Props) {
  return (
    <Pressable
      onPress={() => {
        lightImpact();
        onPress();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        (disabled || loading) && styles.disabled,
        pressed && !(disabled || loading) && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primaryText} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    ...shadows.card,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: { opacity: 0.45 },
  label: {
    ...type.subtitle,
    color: colors.primaryText,
    fontWeight: "700",
  },
});
