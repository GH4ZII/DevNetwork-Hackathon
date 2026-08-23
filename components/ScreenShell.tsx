import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "./ThemeProvider";
import { spacing, tabBarHeight, type ThemeColors } from "./theme";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  hideTabPadding?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenShell({
  children,
  scroll = false,
  hideTabPadding = false,
  style,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const bottomPad = hideTabPadding
    ? insets.bottom + spacing.lg
    : insets.bottom + tabBarHeight + spacing.xl;

  const content = (
    <View
      style={[
        styles.gradient,
        styles.content,
        { paddingBottom: bottomPad, backgroundColor: colors.canvas },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[styles.root, style]}>
      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.glowOrb} pointerEvents="none" />
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    glow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 320,
      backgroundColor: colors.gradientTop,
    },
    glowOrb: {
      position: "absolute",
      top: -40,
      right: -60,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: colors.accentMuted,
      opacity: 0.7,
    },
    gradient: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
    },
    scroll: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    scrollContent: {
      flexGrow: 1,
      backgroundColor: colors.canvas,
    },
  });
}
