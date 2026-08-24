import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { lightImpact } from "../lib/haptics";
import { useTheme } from "./ThemeProvider";
import { radii, shadows, spacing, type, type ThemeColors } from "./theme";

export type ButtonVariant = "primary" | "secondary" | "inverse";

type Props = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = "primary",
  disabled,
  loading,
  compact,
  style,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const palette = variantStyles(colors, variant);

  return (
    <Pressable
      onPress={() => {
        lightImpact();
        onPress();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        { backgroundColor: palette.background },
        (disabled || loading) && styles.disabled,
        pressed && !(disabled || loading) && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {icon ? (
            <Ionicons name={icon} size={compact ? 16 : 18} color={palette.text} />
          ) : null}
          <Text
            style={[styles.label, compact && styles.labelCompact, { color: palette.text }]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

function variantStyles(colors: ThemeColors, variant: ButtonVariant) {
  switch (variant) {
    case "secondary":
      return { background: colors.secondary, text: colors.secondaryText };
    case "inverse":
      return { background: colors.inverse, text: colors.inverseText };
    default:
      return { background: colors.primary, text: colors.primaryText };
  }
}

function createStyles(_colors: ThemeColors) {
  return StyleSheet.create({
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.full,
      minHeight: 52,
      ...shadows.card,
    },
    compact: {
      minHeight: 44,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      gap: spacing.xs,
      minWidth: 0,
    },
    pressed: {
      opacity: 0.88,
      transform: [{ scale: 0.98 }],
    },
    disabled: { opacity: 0.45 },
    label: {
      ...type.subtitle,
      fontWeight: "700",
      fontSize: 15,
    },
    labelCompact: {
      ...type.caption,
      fontWeight: "700",
      fontSize: 13,
      flexShrink: 1,
    },
  });
}
