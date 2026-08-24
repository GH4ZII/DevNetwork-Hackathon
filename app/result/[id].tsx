// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError, getTryOn } from "../../lib/api";
import { lightImpact, successNotify } from "../../lib/haptics";
import { openExternalUrl } from "../../lib/openUrl";
import { session } from "../../lib/session";
import { BeforeAfterSlider } from "../../components/BeforeAfterSlider";
import { GlassButton } from "../../components/GlassButton";
import { useTheme } from "../../components/ThemeProvider";
import {
  radii,
  shadows,
  spacing,
  type,
  type ThemeColors,
} from "../../components/theme";

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  function tryAgain() {
    scanId
      ? router.replace(`/try-on/${scanId}`)
      : router.replace("/(tabs)/camera");
  }

  function newScan() {
    session.lastUserImageUri = undefined;
    session.lastResultImageUrl = undefined;
    router.replace("/(tabs)/camera");
  }

  if (error) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.error}>{error}</Text>
        <GlassButton label="Try another" onPress={tryAgain} />
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

  return (
    <View style={styles.screen}>
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.media, { paddingTop: insets.top }]}
      >
        {userUri ? (
          <BeforeAfterSlider
            beforeUri={userUri}
            afterUri={resultUrl}
            fill
            style={styles.slider}
          />
        ) : (
          <Image
            source={{ uri: resultUrl }}
            style={styles.afterImage}
            resizeMode="contain"
          />
        )}
      </Animated.View>

      <View
        style={[
          styles.dock,
          {
            paddingBottom: Math.max(insets.bottom, spacing.md),
          },
        ]}
      >
        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              lightImpact();
              tryAgain();
            }}
            style={({ pressed }) => [
              styles.ghostBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.ghostLabel}>Retry</Text>
          </Pressable>

          {shopUrl ? (
            <Pressable
              onPress={() => {
                lightImpact();
                openExternalUrl(shopUrl);
              }}
              style={({ pressed }) => [
                styles.shopBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.shopLabel}>Shop</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => {
              lightImpact();
              newScan();
            }}
            style={({ pressed }) => [
              styles.ghostBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.ghostLabel}>New scan</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    media: {
      flex: 1,
      width: "100%",
    },
    slider: {
      flex: 1,
    },
    afterImage: {
      flex: 1,
      width: "100%",
      backgroundColor: colors.canvas,
    },
    dock: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      backgroundColor: colors.canvas,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.glassBorder,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    shopBtn: {
      flex: 1.4,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      ...shadows.card,
    },
    shopLabel: {
      ...type.caption,
      color: colors.primaryText,
      fontWeight: "700",
      fontSize: 14,
    },
    ghostBtn: {
      flex: 1,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    ghostLabel: {
      ...type.caption,
      color: colors.text,
      fontWeight: "600",
      fontSize: 13,
    },
    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.canvas,
      padding: spacing.xl,
      gap: spacing.lg,
    },
    error: {
      ...type.body,
      color: colors.error,
      textAlign: "center",
    },
  });
}
