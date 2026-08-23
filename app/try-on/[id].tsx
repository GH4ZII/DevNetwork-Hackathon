// @ts-nocheck
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ApiError, getScan, getTryOn, postTryOn } from "../../lib/api";
import { session } from "../../lib/session";
import type { ScanResult } from "../../types/realitylens";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hintFor(garment?: ScanResult["garmentCategory"]): string {
  switch (garment) {
    case "shoes":
      return "Use a full-body photo with your feet visible. Only the shoes will change.";
    case "lower_body":
      return "Use a full-body photo with legs visible. Only the bottoms will change.";
    case "upper_body":
      return "Use a photo that shows your torso. Only the top (e.g. sweater) will change.";
    case "full_body":
      return "Use a full-body photo. The outfit on your photo will be replaced.";
    default:
      return "Use a clear full-body photo. Only the scanned item region will change.";
  }
}

export default function TryOnScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [userUri, setUserUri] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | undefined>();
  const [garmentCategory, setGarmentCategory] =
    useState<ScanResult["garmentCategory"]>();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError("Camera or photo permission is required.");
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
    setBusy(true);
    setError(null);
    setStatus("Uploading photos…");
    try {
      const started = await postTryOn({
        scanId: id,
        userImageUri: userUri,
        productImageUrl,
        gender: "male",
      });
      if (!started.jobId) {
        throw new ApiError("Try-on did not return a job id.");
      }
      setStatus("Generating try-on…");
      for (let i = 0; i < 40; i += 1) {
        const current = await getTryOn(started.jobId);
        if (current.status === "completed" && current.resultImageUrl) {
          session.lastUserImageUri = userUri;
          session.lastResultImageUrl = current.resultImageUrl;
          router.push(`/result/${started.jobId}`);
          return;
        }
        if (current.status === "error") {
          throw new ApiError(current.error ?? "Try-on generation failed.");
        }
        await sleep(3000);
      }
      throw new ApiError("Try-on timed out. Try again.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Try-on failed.");
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>You found it. Now wear it.</Text>
      <Text style={styles.copy}>{hintFor(garmentCategory)}</Text>
      {garmentCategory ? (
        <Text style={styles.meta}>Swapping: {garmentCategory.replace("_", " ")}</Text>
      ) : null}

      {userUri ? (
        <View style={styles.previewFrame}>
          <Image
            source={{ uri: userUri }}
            style={styles.preview}
            resizeMode="contain"
          />
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.meta}>No user photo yet</Text>
        </View>
      )}

      <Pressable style={styles.button} onPress={() => pick(true)} disabled={busy}>
        <Text style={styles.buttonText}>Take photo</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => pick(false)} disabled={busy}>
        <Text style={styles.buttonText}>Choose from gallery</Text>
      </Pressable>
      <Pressable
        style={[styles.primary, (!userUri || busy) && styles.disabled]}
        onPress={generate}
        disabled={!userUri || busy}
      >
        {busy ? (
          <ActivityIndicator color="#111" />
        ) : (
          <Text style={styles.primaryText}>Generate Try-On</Text>
        )}
      </Pressable>
      {status ? <Text style={styles.meta}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: 12, flexGrow: 1 },
  title: { color: "#fff", fontSize: 24, fontWeight: "700" },
  copy: { color: "#bbb" },
  previewFrame: {
    width: "100%",
    height: 420,
    borderRadius: 8,
    backgroundColor: "#222",
    overflow: "hidden",
  },
  preview: { width: "100%", height: "100%" },
  placeholder: {
    height: 420,
    borderRadius: 8,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#2a2a2a",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  primary: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  disabled: { opacity: 0.5 },
  primaryText: { color: "#111", fontWeight: "700" },
  meta: { color: "#bbb" },
  error: { color: "#ff8a8a" },
});
