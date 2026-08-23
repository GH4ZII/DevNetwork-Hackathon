import { useEffect, useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "./ThemeProvider";
import { radii, spacing, type ThemeColors } from "./theme";

type SkeletonProps = {
  width?: number | `${number}%` | "100%";
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({
  width = "100%",
  height,
  radius = radii.md,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.85, { duration: 900 }), -1, true);
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius: radius },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function MatchScreenSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.screen}>
      <Skeleton height={340} radius={radii.lg} style={{ marginHorizontal: spacing.xl, marginTop: spacing.lg }} />
      <View style={styles.body}>
        <Skeleton width={88} height={22} radius={radii.full} />
        <Skeleton height={28} />
        <Skeleton width="45%" height={18} />
        <Skeleton width="30%" height={24} style={{ marginTop: spacing.sm }} />
        <View style={styles.ctaRow}>
          <Skeleton height={48} style={styles.ctaFlex} radius={radii.md} />
          <Skeleton height={48} style={styles.ctaFlex} radius={radii.md} />
        </View>
      </View>
      <View style={styles.deals}>
        <Skeleton width="35%" height={22} />
        <Skeleton height={72} radius={radii.lg} />
        <Skeleton height={72} radius={radii.lg} />
        <Skeleton height={72} radius={radii.lg} />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: {
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    screen: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    body: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      gap: spacing.sm,
    },
    ctaRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.md,
    },
    ctaFlex: { flex: 1 },
    deals: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxl,
      gap: spacing.md,
    },
  });
}
