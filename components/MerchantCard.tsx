import { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { lightImpact } from "../lib/haptics";
import { useTheme } from "./ThemeProvider";
import { radii, shadows, spacing, type, type ThemeColors } from "./theme";
import type { Offer } from "../types/realitylens";

type Props = {
  offer: Offer;
  onPress: () => void;
};

export function MerchantCard({ offer, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      style={styles.card}
      onPress={() => {
        lightImpact();
        onPress();
      }}
    >
      {offer.imageUrl ? (
        <Image source={{ uri: offer.imageUrl }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]} />
      )}
      <View style={styles.body}>
        <Text style={styles.merchant} numberOfLines={1}>
          {offer.merchant ?? "Store"}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {offer.title}
        </Text>
        <View style={styles.metaRow}>
          {offer.priceText ? (
            <Text style={styles.price}>{offer.priceText}</Text>
          ) : null}
          {typeof offer.rating === "number" ? (
            <Text style={styles.meta}>
              ★ {offer.rating.toFixed(1)}
              {typeof offer.reviews === "number" ? ` (${offer.reviews})` : ""}
            </Text>
          ) : null}
          {offer.inStock === false ? (
            <Text style={styles.outOfStock}>Out of stock</Text>
          ) : offer.inStock === true ? (
            <Text style={styles.inStock}>In stock</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      gap: spacing.md,
      backgroundColor: colors.glass,
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      ...shadows.card,
    },
    thumb: {
      width: 64,
      height: 64,
      borderRadius: radii.sm,
      backgroundColor: colors.surface,
    },
    thumbEmpty: {
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    body: { flex: 1, gap: 2, justifyContent: "center" },
    merchant: {
      ...type.label,
      color: colors.textMuted,
      textTransform: "uppercase",
    },
    title: {
      ...type.body,
      color: colors.text,
      fontWeight: "600",
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: 2,
      alignItems: "center",
    },
    price: {
      ...type.caption,
      color: colors.text,
      fontWeight: "700",
    },
    meta: {
      ...type.caption,
      color: colors.textMuted,
    },
    inStock: {
      ...type.caption,
      color: colors.success,
    },
    outOfStock: {
      ...type.caption,
      color: colors.error,
    },
  });
}
