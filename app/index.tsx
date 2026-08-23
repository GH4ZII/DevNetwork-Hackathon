// @ts-nocheck
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { API_URL, postScan } from "../lib/api";
import { session } from "../lib/session";

export default function ScanScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.85,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.85,
        });

    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function search() {
    if (!imageUri) {
      setError("Pick or take a product photo first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const scan = await postScan(imageUri);
      session.lastScanId = scan.scanId;
      session.lastShopUrl = scan.bestMatch?.url ?? scan.offers[0]?.url;
      router.push(`/scan/${scan.scanId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>What did you find?</Text>
      <Text style={styles.copy}>Scan a product to find it online.</Text>
      <Text style={styles.meta}>API {API_URL}</Text>

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No photo yet</Text>
        </View>
      )}

      <Pressable style={styles.button} onPress={() => pick(true)} disabled={busy}>
        <Text style={styles.buttonText}>Take photo</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => pick(false)} disabled={busy}>
        <Text style={styles.buttonText}>Choose from gallery</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.primary, (!imageUri || busy) && styles.disabled]}
        onPress={search}
        disabled={!imageUri || busy}
      >
        {busy ? <ActivityIndicator color="#111" /> : <Text style={styles.primaryText}>Search</Text>}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, gap: 12 },
  kicker: { color: "#fff", fontSize: 28, fontWeight: "700" },
  copy: { color: "#bbb", fontSize: 16 },
  meta: { color: "#888", fontSize: 12 },
  preview: { width: "100%", height: 280, borderRadius: 8, backgroundColor: "#222" },
  placeholder: {
    height: 280,
    borderRadius: 8,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { color: "#777" },
  button: {
    backgroundColor: "#2a2a2a",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primary: { backgroundColor: "#fff" },
  disabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "600" },
  primaryText: { color: "#111", fontWeight: "700" },
  error: { color: "#ff8a8a" },
});
