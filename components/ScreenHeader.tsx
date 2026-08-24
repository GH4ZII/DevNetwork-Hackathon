import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { lightImpact } from "../lib/haptics";
import { useTheme } from "./ThemeProvider";
import { radii, spacing, type, type ThemeColors } from "./theme";

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
};

export function ScreenHeader({ title, subtitle, onBack }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      {onBack ? (
        <View style={styles.topRow}>
          <Pressable
            onPress={() => {
              lightImpact();
              onBack();
            }}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <View style={styles.titles}>
            <Text style={styles.titleCentered}>{title}</Text>
            {subtitle ? (
              <Text style={styles.subtitleCentered}>{subtitle}</Text>
            ) : null}
          </View>
          <View style={styles.backBtnSpacer} />
        </View>
      ) : (
        <>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.xs,
      marginBottom: spacing.lg,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    backBtnSpacer: {
      width: 40,
      height: 40,
    },
    titles: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: spacing.sm,
    },
    title: {
      ...type.hero,
      fontSize: 28,
      color: colors.text,
    },
    titleCentered: {
      ...type.title,
      fontSize: 20,
      color: colors.text,
      textAlign: "center",
    },
    subtitle: {
      ...type.body,
      color: colors.textMuted,
    },
    subtitleCentered: {
      ...type.caption,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: 2,
    },
  });
}
