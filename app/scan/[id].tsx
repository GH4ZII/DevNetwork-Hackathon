// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { ApiError, getScan } from "../../lib/api";
import { lightImpact } from "../../lib/haptics";
import { openExternalUrl } from "../../lib/openUrl";
import { session } from "../../lib/session";
import { GlassButton } from "../../components/GlassButton";
import { GlassCard } from "../../components/GlassCard";
import { MatchLabelBadge } from "../../components/MatchLabelBadge";
import { MerchantCard } from "../../components/MerchantCard";
import { PrimaryButton } from "../../components/PrimaryButton";
import { OfferSheet } from "../../components/OfferSheet";
import { PriceFrom } from "../../components/PriceFrom";
import { MatchScreenSkeleton } from "../../components/Skeleton";
import { useTheme } from "../../components/ThemeProvider";
import {
  formatCategory,
  radii,
  shadows,
  spacing,
  type,
  type ThemeColors,
} from "../../components/theme";

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollRef = useRef(null);
  const [scan, setScan] = useState(null);
  const [error, setError] = useState(null);
  const [dealsY, setDealsY] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState(null);

  useEffect(() => {
    if (!id) return;
    getScan(id)
      .then((result) => {
        setScan(result);
        setHeroIndex(0);
        session.lastScanId = result.scanId;
        session.lastShopUrl = result.bestMatch?.url ?? result.offers[0]?.url;
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load scan.",
        );
      });
  }, [id]);

  const heroCandidates = useMemo(() => {
    if (!scan) return [];
    const urls = [
      scan.bestMatch?.imageUrl,
      ...scan.offers.map((offer) => offer.imageUrl),
    ].filter((uri): uri is string => Boolean(uri));
    return [...new Set(urls)];
  }, [scan]);

  const heroUri = heroCandidates[heroIndex] ?? null;

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <GlassButton label="Scan again" onPress={() => router.replace("/(tabs)/camera")} />
      </View>
    );
  }

  if (!scan) {
    return <MatchScreenSkeleton />;
  }

  const match = scan.bestMatch;
  const empty = !match && scan.offers.length === 0;

  function viewDeals() {
    scrollRef.current?.scrollTo({ y: Math.max(0, dealsY - 12), animated: true });
  }

  function onHeroError() {
    setHeroIndex((i) => i + 1);
  }

  function openBestMatch() {
    if (!match?.url) return;
    lightImpact();
    void openExternalUrl(match.url);
  }

  function startTryOn(imageUrl?: string, shopUrl?: string) {
    session.pendingTryOnImageUrl = imageUrl;
    session.lastShopUrl = shopUrl ?? session.lastShopUrl;
    router.push(`/try-on/${scan.scanId}`);
  }

  if (empty) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No product found</Text>
        <Text style={styles.emptyCopy}>
          We couldn't match this photo to a product. Try a clearer shot of the
          item with good lighting.
        </Text>
        <GlassButton label="Scan again" onPress={() => router.replace("/(tabs)/camera")} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.screen}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(320)} style={styles.heroWrap}>
        <Pressable onPress={openBestMatch} disabled={!match?.url}>
          {heroUri ? (
            <Image
              key={heroUri}
              source={{ uri: heroUri }}
              style={styles.hero}
              resizeMode="cover"
              onError={onHeroError}
            />
          ) : (
            <View style={[styles.hero, styles.heroEmpty]}>
              <Text style={styles.meta}>No product image</Text>
            </View>
          )}
        </Pressable>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(360).delay(80)}
        style={styles.heroBody}
      >
        <GlassCard style={styles.infoCard}>
          <Pressable
            onPress={openBestMatch}
            disabled={!match?.url}
            style={styles.matchHit}
          >
            <MatchLabelBadge label={match?.label} />
            <Text style={styles.title}>
              {match?.title ?? "Similar products"}
            </Text>
            {match?.category ? (
              <Text style={styles.category}>
                {formatCategory(match.category)}
              </Text>
            ) : null}
            <PriceFrom match={match} offers={scan.offers} />
          </Pressable>

          {!match ? (
            <Text style={styles.meta}>
              No clear visual match — browse shopping results below.
            </Text>
          ) : null}

          <View style={styles.ctaRow}>
            {scan.tryOnSupported ? (
              <PrimaryButton
                label="Try On"
                onPress={() =>
                  startTryOn(
                    match?.imageUrl ?? scan.offers[0]?.imageUrl,
                    match?.url ?? scan.offers[0]?.url,
                  )
                }
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
              Try-on is available for shoes, clothing, and watches.
            </Text>
          ) : null}
        </GlassCard>
      </Animated.View>

      <View
        style={styles.deals}
        onLayout={(e) => setDealsY(e.nativeEvent.layout.y)}
      >
        <Text style={styles.section}>Shop it</Text>
        {scan.offers.length === 0 ? (
          <Text style={styles.meta}>No shopping results for this match.</Text>
        ) : (
          scan.offers.slice(0, 8).map((offer) => (
            <MerchantCard
              key={offer.id}
              offer={offer}
              onPress={() => {
                setSelectedOffer(offer);
              }}
            />
          ))
        )}
      </View>
    </ScrollView>
    <OfferSheet
      offer={selectedOffer}
      tryOnSupported={scan.tryOnSupported}
      onClose={() => setSelectedOffer(null)}
      onTryOn={(offer) => {
        setSelectedOffer(null);
        startTryOn(offer.imageUrl, offer.url);
      }}
      onVisit={(offer) => {
        setSelectedOffer(null);
        void openExternalUrl(offer.url);
      }}
    />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
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
    emptyTitle: {
      ...type.title,
      color: colors.text,
      textAlign: "center",
    },
    emptyCopy: {
      ...type.body,
      color: colors.textMuted,
      textAlign: "center",
    },
    heroWrap: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      ...shadows.card,
    },
    hero: {
      width: "100%",
      height: 320,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      overflow: "hidden",
    },
    heroEmpty: {
      alignItems: "center",
      justifyContent: "center",
    },
    heroBody: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
    },
    infoCard: {
      gap: spacing.sm,
    },
    matchHit: {
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
}
