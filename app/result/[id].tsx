// @ts-nocheck
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError, getTryOn } from "../../lib/api";
import { successNotify } from "../../lib/haptics";
import { openExternalUrl } from "../../lib/openUrl";
import { session } from "../../lib/session";
import { BeforeAfterSlider } from "../../components/BeforeAfterSlider";
import { GlassButton } from "../../components/GlassButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, radii, shadows, spacing, type } from "../../components/theme";

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [resultUrl, setResultUrl] = useState(session.lastResultImageUrl);
  const [error, setError] = useState(null);
  const userUri = session.lastUserImageUri;
  const shopUrl = session.lastShopUrl;
  const scanId = session.lastScanId;

  useEffect(() => {
    if (resultUrl || !id) return;
    getTryOn(id)
      .then((job) => {
        if (job.resultImageUrl) setResultUrl(job.resultImageUrl);
        else if (job.status === "error") {
          setError("Generation failed. Try another photo.");
        }
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? "Could not load your try-on result."
            : "Could not load result.",
        );
      });
  }, [id, resultUrl]);

  useEffect(() => {
    if (resultUrl) successNotify();
  }, [resultUrl]);

  if (error) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.error}>{error}</Text>
        <GlassButton
          label="Try another"
          onPress={() =>
            scanId
              ? router.replace(`/try-on/${scanId}`)
              : router.replace("/(tabs)/camera")
          }
        />
      </View>
    );
  }

  if (!resultUrl) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const topPad = insets.top + spacing.md;

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.glow} pointerEvents="none" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View entering={FadeIn.duration(400)} style={styles.sliderArea}>
          {userUri ? (
            <BeforeAfterSlider beforeUri={userUri} afterUri={resultUrl} />
          ) : (
            <View style={styles.afterOnly}>
              <Image
                source={{ uri: resultUrl }}
                style={styles.afterImage}
                resizeMode="contain"
              />
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.bottom}>
        <Text style={styles.caption}>Your look</Text>
        {shopUrl ? (
          <PrimaryButton
            label="Shop this look"
            onPress={() => openExternalUrl(shopUrl)}
          />
        ) : null}
        <View style={styles.row}>
          <GlassButton
            label="Try another"
            compact
            onPress={() =>
              scanId
                ? router.replace(`/try-on/${scanId}`)
                : router.replace("/(tabs)/camera")
            }
            style={styles.flex}
          />
          <GlassButton
            label="Scan something else"
            compact
            onPress={() => {
              session.lastUserImageUri = undefined;
              session.lastResultImageUrl = undefined;
              router.replace("/(tabs)/camera");
            }}
            style={styles.flex}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  glow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: colors.gradientTop,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  sliderArea: {
    width: "100%",
  },
  afterOnly: {
    width: "100%",
    minHeight: 320,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.card,
  },
  afterImage: {
    width: "100%",
    height: "100%",
  },
  bottom: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  caption: {
    ...type.label,
    color: colors.accent,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  flex: { flex: 1 },
  error: {
    ...type.body,
    color: colors.error,
    textAlign: "center",
  },
});
