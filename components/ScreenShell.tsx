import type { ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, tabBarHeight } from "./theme";

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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  glow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: colors.gradientTop,
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
