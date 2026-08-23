// @ts-nocheck
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
import { colors, radii, spacing, type } from "../components/theme";

const STAGES = [
  "Analyzing object",
  "Finding visual matches",
  "Comparing stores",
];

export default function SearchingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState(null);
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [pulse]);

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
        // Empty results still land on the match screen for a dedicated fallback.
        router.replace(`/scan/${scan.scanId}`);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Search failed. Check that the server is running, then try again.",
          );
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

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xxxl }]}>
      <Text style={styles.kicker}>RealityLens</Text>
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
              router.replace("/");
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.xl,
    gap: spacing.xxl,
  },
  kicker: {
    ...type.label,
    color: colors.textMuted,
    textTransform: "uppercase",
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
    backgroundColor: colors.text,
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
    borderRadius: radii.md,
  },
  backText: {
    ...type.subtitle,
    color: colors.text,
    fontWeight: "600",
  },
});
