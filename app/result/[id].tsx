// @ts-nocheck
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ApiError, getTryOn } from "../../lib/api";
import { session } from "../../lib/session";

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [resultUrl, setResultUrl] = useState(session.lastResultImageUrl);
  const [error, setError] = useState<string | null>(null);
  const userUri = session.lastUserImageUri;
  const shopUrl = session.lastShopUrl;

  useEffect(() => {
    if (resultUrl || !id) return;
    getTryOn(id)
      .then((job) => {
        if (job.resultImageUrl) setResultUrl(job.resultImageUrl);
        else if (job.status === "error") setError(job.error ?? "Try-on failed.");
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load result.");
      });
  }, [id, resultUrl]);

  if (error) {
    return (
      <View style={styles.screen}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!resultUrl) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Try-on result</Text>
      {userUri ? (
        <>
          <Text style={styles.meta}>Before</Text>
          <Image source={{ uri: userUri }} style={styles.image} />
        </>
      ) : null}
      <Text style={styles.meta}>After</Text>
      <Image source={{ uri: resultUrl }} style={styles.image} />
      {shopUrl ? (
        <Pressable style={styles.primary} onPress={() => Linking.openURL(shopUrl)}>
          <Text style={styles.primaryText}>Shop this look</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 24, fontWeight: "700" },
  meta: { color: "#bbb" },
  image: { width: "100%", height: 280, borderRadius: 8, backgroundColor: "#222" },
  primary: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryText: { color: "#111", fontWeight: "700" },
  error: { color: "#ff8a8a" },
});
