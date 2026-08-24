import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "./ThemeProvider";
import { radii, spacing, type, type ThemeColors } from "./theme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  style?: StyleProp<ViewStyle>;
};

export function InfoCard({ icon, title, description, style }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={colors.primaryText} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    title: {
      ...type.subtitle,
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    description: {
      ...type.caption,
      color: colors.textMuted,
    },
  });
}
