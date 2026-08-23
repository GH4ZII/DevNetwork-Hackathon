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
import { ApiError, getScan } from "../../lib/api";
import { session } from "../../lib/session";
import { GlassButton } from "../../components/GlassButton";
import { MatchLabelBadge } from "../../components/MatchLabelBadge";
import { MerchantCard } from "../../components/MerchantCard";
import { PrimaryButton } from "../../components/PrimaryButton";
import { PriceFrom } from "../../components/PriceFrom";
import {
  colors,
  formatCategory,
  spacing,
  type,
} from "../../components/theme";

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scrollRef = useRef(null);
  const [scan, setScan] = useState(null);
  const [error, setError] = useState(null);
  const [dealsY, setDealsY] = useState(0);

  useEffect(() => {
    if (!id) return;
    getScan(id)
      .then((result) => {
        setScan(result);
        session.lastScanId = result.scanId;
        session.lastShopUrl = result.bestMatch?.url ?? result.offers[0]?.url;
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? "We couldn't load this match. Try scanning again."
            : "Could not load scan.",
        );
      });
  }, [id]);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <GlassButton label="Scan again" onPress={() => router.replace("/")} />
      </View>
    );
  }

  if (!scan) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  const match = scan.bestMatch;

  function viewDeals() {
    scrollRef.current?.scrollTo({ y: Math.max(0, dealsY - 12), animated: true });
  }

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.screen}
      showsVerticalScrollIndicator={false}
    >
      {match?.imageUrl ? (
        <Image source={{ uri: match.imageUrl }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroEmpty]}>
          <Text style={styles.meta}>No product image</Text>
        </View>
      )}

      <View style={styles.heroBody}>
        <MatchLabelBadge label={match?.label} />
        <Text style={styles.title}>{match?.title ?? "No match found"}</Text>
        {match?.category ? (
          <Text style={styles.category}>{formatCategory(match.category)}</Text>
        ) : null}
        <PriceFrom offers={scan.offers} />

        {!match ? (
          <Text style={styles.meta}>
            We couldn't identify this product. Try a clearer photo.
          </Text>
        ) : null}

        <View style={styles.ctaRow}>
          {scan.tryOnSupported ? (
            <PrimaryButton
              label="Try On"
              onPress={() => router.push(`/try-on/${scan.scanId}`)}
              style={styles.ctaFlex}
            />
          ) : null}
          {scan.offers.length > 0 ? (
            <GlassButton
              label="View Deals"
              onPress={viewDeals}
              style={styles.ctaFlex}
            />
          ) : null}
        </View>

        {!scan.tryOnSupported && match ? (
          <Text style={styles.meta}>
            Try-on is available for shoes and clothing.
          </Text>
        ) : null}
      </View>

      <View
        style={styles.deals}
        onLayout={(e) => setDealsY(e.nativeEvent.layout.y)}
      >
        <Text style={styles.section}>Shop it</Text>
        {scan.offers.length === 0 ? (
          <Text style={styles.meta}>No shopping results for this match.</Text>
        ) : (
          scan.offers.slice(0, 8).map((offer) => (
            <MerchantCard key={offer.id} offer={offer} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: spacing.xxxl,
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
  hero: {
    width: "100%",
    height: 340,
    backgroundColor: colors.surface,
  },
  heroEmpty: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroBody: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...type.title,
    color: colors.text,
  },
  category: {
    ...type.subtitle,
    color: colors.textMuted,
  },
  ctaRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  ctaFlex: { flex: 1 },
  deals: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  section: {
    ...type.title,
    fontSize: 20,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  meta: {
    ...type.body,
    color: colors.textMuted,
  },
  error: {
    ...type.body,
    color: colors.error,
    textAlign: "center",
  },
});
