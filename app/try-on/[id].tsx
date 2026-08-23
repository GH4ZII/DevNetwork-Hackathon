// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ApiError, getScan, getTryOn, postTryOn } from "../../lib/api";
import { session } from "../../lib/session";
import { GlassButton } from "../../components/GlassButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, radii, spacing, type } from "../../components/theme";
import type { ScanResult } from "../../types/realitylens";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hintFor(garment?: ScanResult["garmentCategory"]): string {
  switch (garment) {
    case "shoes":
      return "Stand so your feet are clearly visible. Only the shoes will change.";
    case "lower_body":
      return "Use a full-body photo with legs visible. Only the bottoms will change.";
    case "upper_body":
      return "Frame your torso in the shot. Only the top will change.";
    case "full_body":
      return "Use a full-body photo. The outfit on your photo will be replaced.";
    default:
      return "Use a clear full-body photo. Only the scanned item region will change.";
  }
}

function frameLabel(garment?: ScanResult["garmentCategory"]): string {
  switch (garment) {
    case "shoes":
      return "Full body · feet visible";
    case "lower_body":
      return "Full body · legs visible";
    case "upper_body":
      return "Half body · torso";
    case "full_body":
      return "Full body";
    default:
      return "Full body preferred";
  }
}

export default function TryOnScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [userUri, setUserUri] = useState(null);
  const [productImageUrl, setProductImageUrl] = useState(undefined);
  const [garmentCategory, setGarmentCategory] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const generateEpoch = useRef(0);

  useEffect(() => {
    return () => {
      generateEpoch.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    getScan(id)
      .then((scan) => {
        setProductImageUrl(scan.bestMatch?.imageUrl ?? scan.offers[0]?.imageUrl);
        setGarmentCategory(scan.garmentCategory);
        session.lastShopUrl = scan.bestMatch?.url ?? scan.offers[0]?.url;
      })
      .catch(() => undefined);
  }, [id]);

  async function pick(fromCamera: boolean) {
    setError(null);
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(
        fromCamera
          ? "Camera access is needed for your try-on photo."
          : "Photo library access is needed to choose a photo.",
      );
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.9,
        });
    if (!result.canceled && result.assets[0]?.uri) {
      setUserUri(result.assets[0].uri);
    }
  }

  async function generate() {
    if (!id || !userUri) {
      setError("Take or pick a photo of yourself first.");
      return;
    }
    const epoch = ++generateEpoch.current;
    setBusy(true);
    setError(null);
    setStatus("Uploading…");
    try {
      const started = await postTryOn({
        scanId: id,
        userImageUri: userUri,
        productImageUrl,
        gender: "male",
      });
      if (epoch !== generateEpoch.current) return;
      if (!started.jobId) {
        throw new ApiError("Try-on did not return a job id.");
      }

      if (started.status === "completed" && started.resultImageUrl) {
        session.lastUserImageUri = userUri;
        session.lastResultImageUrl = started.resultImageUrl;
        router.push(`/result/${started.jobId}`);
        return;
      }

      setStatus("Generating…");
      for (let i = 0; i < 40; i += 1) {
        if (epoch !== generateEpoch.current) return;
        const current = await getTryOn(started.jobId);
        if (current.status === "completed" && current.resultImageUrl) {
          session.lastUserImageUri = userUri;
          session.lastResultImageUrl = current.resultImageUrl;
          router.push(`/result/${started.jobId}`);
          return;
        }
        if (current.status === "error") {
          throw new ApiError(
            current.error || "Generation failed. Try a clearer photo.",
          );
        }
        await sleep(3000);
      }
      throw new ApiError("This is taking too long. Try again.");
    } catch (err) {
      if (epoch !== generateEpoch.current) return;
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      if (epoch === generateEpoch.current) {
        setBusy(false);
        setStatus(null);
      }
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>You found it.{"\n"}Now wear it.</Text>
      <Text style={styles.copy}>{hintFor(garmentCategory)}</Text>

      <View style={styles.frameGuide}>
        <View style={styles.silhouette}>
          <View style={styles.silHead} />
          <View style={styles.silBody} />
          {(garmentCategory === "shoes" ||
            garmentCategory === "lower_body" ||
            garmentCategory === "full_body" ||
            !garmentCategory) && <View style={styles.silFeet} />}
        </View>
        <Text style={styles.frameLabel}>{frameLabel(garmentCategory)}</Text>
      </View>

      {userUri ? (
        <View style={styles.previewFrame}>
          <Image
            source={{ uri: userUri }}
            style={styles.preview}
            resizeMode="cover"
          />
        </View>
      ) : null}

      <View style={styles.actions}>
        <GlassButton
          label="Take photo"
          onPress={() => pick(true)}
          disabled={busy}
        />
        <GlassButton
          label="Choose from gallery"
          onPress={() => pick(false)}
          disabled={busy}
        />
        <PrimaryButton
          label="Generate Try-On"
          onPress={generate}
          disabled={!userUri || busy}
          loading={busy}
        />
      </View>

      {busy && status ? (
        <View style={styles.statusRow}>
          <ActivityIndicator color={colors.text} />
          <Text style={styles.status}>{status}</Text>
        </View>
      ) : null}
      {error ? (
        <View style={styles.errorBlock}>
          <Text style={styles.error}>{error}</Text>
          {userUri ? (
            <GlassButton
              label="Retry try-on"
              onPress={generate}
              disabled={busy}
            />
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: spacing.xl,
    gap: spacing.lg,
    flexGrow: 1,
    backgroundColor: colors.canvas,
    paddingBottom: spacing.xxxl,
  },
  title: {
    ...type.hero,
    fontSize: 30,
    color: colors.text,
  },
  copy: {
    ...type.body,
    color: colors.textMuted,
  },
  frameGuide: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    gap: spacing.lg,
  },
  silhouette: {
    alignItems: "center",
    gap: 6,
    opacity: 0.55,
  },
  silHead: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.text,
  },
  silBody: {
    width: 72,
    height: 110,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.text,
  },
  silFeet: {
    width: 56,
    height: 14,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.text,
  },
  frameLabel: {
    ...type.label,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  previewFrame: {
    width: "100%",
    height: 360,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  preview: { width: "100%", height: "100%" },
  actions: { gap: spacing.md },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  status: {
    ...type.body,
    color: colors.textMuted,
  },
  error: {
    ...type.body,
    color: colors.error,
  },
  errorBlock: {
    gap: spacing.md,
  },
});
