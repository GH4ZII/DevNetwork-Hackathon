// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
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
import {
  appendStep,
  createCollection,
  findCollectionByJobId,
} from "../../lib/looks";
import { openExternalUrl } from "../../lib/openUrl";
import { clearContinueLook, session } from "../../lib/session";
import { BeforeAfterSlider } from "../../components/BeforeAfterSlider";
import { InfoCard } from "../../components/InfoCard";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useTheme } from "../../components/ThemeProvider";
import { radii, spacing, type, type ThemeColors } from "../../components/theme";

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [resultUrl, setResultUrl] = useState(session.lastResultImageUrl);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedCollectionId, setSavedCollectionId] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const userUri = session.lastUserImageUri;
  const shopUrl = session.lastShopUrl;
  const scanId = session.lastScanId;
  const saved = Boolean(savedCollectionId);

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

  useEffect(() => {
    if (!id) return;
    findCollectionByJobId(id)
      .then((collection) => {
        if (collection) setSavedCollectionId(collection.id);
      })
      .catch(() => undefined);
  }, [id]);

  function tryAgain() {
    scanId
      ? router.replace(`/try-on/${scanId}`)
      : router.replace("/(tabs)/camera");
  }

  function newScan() {
    session.lastUserImageUri = undefined;
    session.lastResultImageUrl = undefined;
    clearContinueLook();
    router.replace("/(tabs)/camera");
  }

  async function saveLook() {
    if (!resultUrl || saving || saved) return;
    setSaving(true);
    setSaveError(null);
    try {
      const input = {
        resultImageUrl: resultUrl,
        baseImageUri: userUri,
        productTitle: session.lastProductTitle,
        productImageUrl: session.lastProductImageUrl,
        garmentCategory: session.lastGarmentCategory,
        shopUrl,
        scanId,
        jobId: id,
      };
      const collection = session.continueCollectionId
        ? await appendStep(session.continueCollectionId, input)
        : await createCollection(input);
      clearContinueLook();
      setSavedCollectionId(collection.id);
      successNotify();
    } catch {
      setSaveError("Could not save this look. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.error}>{error}</Text>
        <PrimaryButton
          icon="refresh-outline"
          variant="secondary"
          label="Try another"
          onPress={tryAgain}
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

  return (
    <View style={styles.screen}>
      <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg }}>
        <ScreenHeader
          title="Your look"
          subtitle="See the try-on on you"
          onBack={() => (router.canGoBack() ? router.back() : tryAgain())}
        />
      </View>

      <Animated.View entering={FadeIn.duration(400)} style={styles.media}>
        <View style={styles.mediaFrame}>
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
        </View>
      </Animated.View>

      <View
        style={[
          styles.dock,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <InfoCard
          icon="sparkles"
          title="AI try-on"
          description="Only the scanned item region is changed. The rest of you stays the same."
        />
        {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
        {saved ? (
          <PrimaryButton
            icon="images-outline"
            label="View look"
            onPress={() => router.push(`/look/${savedCollectionId}`)}
          />
        ) : (
          <PrimaryButton
            icon="download-outline"
            label="Save"
            loading={saving}
            onPress={() => void saveLook()}
          />
        )}
        <View style={styles.actions}>
          <PrimaryButton
            icon="refresh-outline"
            variant="secondary"
            compact
            label="Retry"
            onPress={tryAgain}
            style={styles.actionBtn}
          />
          {shopUrl ? (
            <PrimaryButton
              icon="sparkles-outline"
              variant="inverse"
              compact
              label="Shop"
              onPress={() => openExternalUrl(shopUrl)}
              style={styles.actionBtn}
            />
          ) : null}
          <PrimaryButton
            icon="scan-outline"
            variant="secondary"
            compact
            label="New scan"
            onPress={newScan}
            style={styles.actionBtn}
          />
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
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    mediaFrame: {
      flex: 1,
      borderRadius: radii.xl,
      overflow: "hidden",
      backgroundColor: colors.surface,
    },
    slider: {
      flex: 1,
    },
    afterImage: {
      flex: 1,
      width: "100%",
      backgroundColor: colors.surface,
    },
    dock: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      backgroundColor: colors.canvas,
      gap: spacing.md,
    },
    saveError: {
      ...type.caption,
      color: colors.error,
      textAlign: "center",
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    actionBtn: {
      flex: 1,
      minWidth: 0,
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
