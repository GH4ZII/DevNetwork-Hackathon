// @ts-nocheck
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ApiError, getScan, getTryOn, postTryOn } from "../../lib/api";
import { session } from "../../lib/session";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function TryOnScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [gender, setGender] = useState<"male" | "female">("male");
  const [userUri, setUserUri] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getScan(id)
      .then((scan) => {
        setProductImageUrl(scan.bestMatch?.imageUrl ?? scan.offers[0]?.imageUrl);
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
      setError("Take or pick a full-body / lower-body photo first.");
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
        gender,
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
    <View style={styles.screen}>
      <Text style={styles.title}>You found it. Now wear it.</Text>
      <Text style={styles.copy}>
        Use a full-body or lower-body photo with your feet visible.
      </Text>

      <View style={styles.row}>
        <Pressable
          style={[styles.chip, gender === "male" && styles.chipOn]}
          onPress={() => setGender("male")}
        >
          <Text style={styles.chipText}>Male</Text>
        </Pressable>
        <Pressable
          style={[styles.chip, gender === "female" && styles.chipOn]}
          onPress={() => setGender("female")}
        >
          <Text style={styles.chipText}>Female</Text>
        </Pressable>
      </View>

      {userUri ? (
        <Image source={{ uri: userUri }} style={styles.preview} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, gap: 12 },
  title: { color: "#fff", fontSize: 24, fontWeight: "700" },
  copy: { color: "#bbb" },
  row: { flexDirection: "row", gap: 8 },
  chip: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
  },
  chipOn: { backgroundColor: "#555" },
  chipText: { color: "#fff", fontWeight: "600" },
  preview: { width: "100%", height: 240, borderRadius: 8, backgroundColor: "#222" },
  placeholder: {
    height: 240,
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
