// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError, postScan } from "../lib/api";
import { session } from "../lib/session";
import { useTheme } from "../components/ThemeProvider";
import { radii, spacing, type, type ThemeColors } from "../components/theme";

const STAGES = [
  "Analyzing object",
  "Finding visual matches",
  "Comparing stores",
];

export default function SearchingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState(null);
  const pulse = useSharedValue(0.35);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
    ringScale.value = withRepeat(withTiming(1.15, { duration: 1200 }), -1, true);
  }, [pulse, ringScale]);

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((i) => (i + 1) % STAGES.length);
    }, 1600);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const uri = session.pendingScanUri;
    if (!uri) {
      setError("No photo to search. Go back and capture one.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const scan = await postScan(uri);
        if (cancelled) return;
        session.pendingScanUri = undefined;
        session.lastScanId = scan.scanId;
        session.lastShopUrl = scan.bestMatch?.url ?? scan.offers[0]?.url;
        router.replace(`/scan/${scan.scanId}`);
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Search failed. Check that the server is running, then try again.";
          setError(message);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const barStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scaleX: 0.55 + pulse.value * 0.45 }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: 0.35 + (ringScale.value - 1) * 2,
  }));

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xxxl }]}>
      <View style={styles.glow} pointerEvents="none" />
      <Text style={styles.kicker}>RealityLens</Text>

      <View style={styles.iconWrap}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <View style={styles.iconCircle}>
          <Ionicons name="search" size={28} color={colors.accent} />
        </View>
      </View>

      <View style={styles.stageWrap}>
        <Animated.Text
          key={STAGES[stageIndex]}
          entering={FadeIn.duration(280)}
          exiting={FadeOut.duration(180)}
          style={styles.stage}
        >
          {STAGES[stageIndex]}
        </Animated.Text>
        <Animated.View style={[styles.bar, barStyle]} />
      </View>

      {error ? (
        <View style={styles.errorBlock}>
          <Text style={styles.error}>{error}</Text>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              session.pendingScanUri = undefined;
              router.replace("/(tabs)/camera");
            }}
          >
            <Text style={styles.backText}>Back to camera</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.hint}>This usually takes a few seconds.</Text>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.canvas,
      paddingHorizontal: spacing.xl,
      gap: spacing.xxl,
    },
    glow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 280,
      backgroundColor: colors.gradientTop,
    },
    kicker: {
      ...type.label,
      color: colors.accent,
      textTransform: "uppercase",
    },
    iconWrap: {
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      width: 96,
      height: 96,
    },
    ring: {
      position: "absolute",
      width: 96,
      height: 96,
      borderRadius: radii.full,
      borderWidth: 2,
      borderColor: colors.accent,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: radii.full,
      backgroundColor: colors.accentMuted,
      borderWidth: 1,
      borderColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    stageWrap: {
      gap: spacing.lg,
    },
    stage: {
      ...type.hero,
      color: colors.text,
      fontSize: 28,
    },
    bar: {
      height: 3,
      width: "100%",
      borderRadius: radii.full,
      backgroundColor: colors.accent,
    },
    hint: {
      ...type.body,
      color: colors.textDim,
    },
    errorBlock: {
      gap: spacing.lg,
    },
    error: {
      ...type.body,
      color: colors.error,
    },
    backBtn: {
      alignSelf: "flex-start",
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radii.lg,
    },
    backText: {
      ...type.subtitle,
      color: colors.text,
      fontWeight: "600",
    },
  });
}
