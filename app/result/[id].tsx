// @ts-nocheck
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { colors, spacing, type } from "../../components/theme";

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
            scanId ? router.replace(`/try-on/${scanId}`) : router.replace("/")
          }
        />
      </View>
    );
  }

  if (!resultUrl) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + spacing.lg }]}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.sliderArea}>
        {userUri ? (
          <BeforeAfterSlider beforeUri={userUri} afterUri={resultUrl} />
        ) : (
          <View style={styles.afterOnly}>
            <Image
              source={{ uri: resultUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          </View>
        )}
      </Animated.View>

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
              scanId ? router.replace(`/try-on/${scanId}`) : router.replace("/")
            }
            style={styles.flex}
          />
          <GlassButton
            label="Scan something else"
            compact
            onPress={() => {
              session.lastUserImageUri = undefined;
              session.lastResultImageUrl = undefined;
              router.replace("/");
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  sliderArea: {
    flex: 1,
    padding: spacing.md,
  },
  afterOnly: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  bottom: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  caption: {
    ...type.label,
    color: colors.textMuted,
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
