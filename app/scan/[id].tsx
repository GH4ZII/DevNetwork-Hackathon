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
import { useLocalSearchParams, useRouter } from "expo-router";
import { ApiError, getScan } from "../../lib/api";
import { session } from "../../lib/session";
import type { ScanResult } from "../../types/realitylens";

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getScan(id)
      .then((result) => {
        setScan(result);
        session.lastScanId = result.scanId;
        session.lastShopUrl = result.bestMatch?.url ?? result.offers[0]?.url;
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load scan.");
      });
  }, [id]);

  if (error) {
    return (
      <View style={styles.screen}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!scan) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  const match = scan.bestMatch;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {match?.imageUrl ? (
        <Image source={{ uri: match.imageUrl }} style={styles.hero} />
      ) : null}
      <Text style={styles.title}>{match?.title ?? "No match found"}</Text>
      <Text style={styles.meta}>
        {match?.category ?? "unknown"} · {match?.label ?? "no result"}
      </Text>
      {match?.source ? <Text style={styles.meta}>{match.source}</Text> : null}

      {scan.tryOnSupported ? (
        <Pressable
          style={styles.primary}
          onPress={() => router.push(`/try-on/${scan.scanId}`)}
        >
          <Text style={styles.primaryText}>Try On</Text>
        </Pressable>
      ) : (
        <Text style={styles.meta}>Try-on is only available for shoes in Phase 1.</Text>
      )}

      <Text style={styles.section}>Offers</Text>
      {scan.offers.length === 0 ? (
        <Text style={styles.meta}>No shopping results.</Text>
      ) : (
        scan.offers.slice(0, 8).map((offer) => (
          <Pressable
            key={offer.id}
            style={styles.card}
            onPress={() => offer.url && Linking.openURL(offer.url)}
          >
            <Text style={styles.cardTitle}>{offer.title}</Text>
            <Text style={styles.meta}>
              {offer.merchant ?? "Unknown store"}
              {offer.priceText ? ` · ${offer.priceText}` : ""}
            </Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 20, gap: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { width: "100%", height: 240, borderRadius: 8, backgroundColor: "#222" },
  title: { color: "#fff", fontSize: 24, fontWeight: "700" },
  meta: { color: "#bbb" },
  section: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 12 },
  card: { backgroundColor: "#222", padding: 12, borderRadius: 8, gap: 4 },
  cardTitle: { color: "#fff", fontWeight: "600" },
  primary: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  primaryText: { color: "#111", fontWeight: "700" },
  error: { color: "#ff8a8a" },
});
