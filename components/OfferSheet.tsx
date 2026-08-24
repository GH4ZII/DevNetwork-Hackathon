import { useMemo } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightImpact } from "../lib/haptics";
import { GlassButton } from "./GlassButton";
import { PrimaryButton } from "./PrimaryButton";
import { useTheme } from "./ThemeProvider";
import { radii, shadows, spacing, type, type ThemeColors } from "./theme";
import type { Offer } from "../types/realitylens";

type Props = {
  offer: Offer | null;
  tryOnSupported: boolean;
  onClose: () => void;
  onTryOn: (offer: Offer) => void;
  onVisit: (offer: Offer) => void;
};

export function OfferSheet({
  offer,
  tryOnSupported,
  onClose,
  onTryOn,
  onVisit,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      visible={Boolean(offer)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        {offer ? (
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
          >
            <View style={styles.handle} />
            <View style={styles.product}>
              {offer.imageUrl ? (
                <Image source={{ uri: offer.imageUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbEmpty]} />
              )}
              <View style={styles.copy}>
                <Text style={styles.merchant} numberOfLines={1}>
                  {offer.merchant ?? "Store"}
                </Text>
                <Text style={styles.title} numberOfLines={2}>
                  {offer.title}
                </Text>
                {offer.priceText ? (
                  <Text style={styles.price}>{offer.priceText}</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.actions}>
              {tryOnSupported ? (
                <PrimaryButton
                  label="Try On"
                  onPress={() => {
                    lightImpact();
                    onTryOn(offer);
                  }}
                />
              ) : null}
              <GlassButton
                label="Visit site"
                onPress={() => {
                  lightImpact();
                  onVisit(offer);
                }}
              />
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    sheet: {
      backgroundColor: colors.surfaceRaised,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      gap: spacing.lg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      ...shadows.tabBar,
    },
    handle: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: radii.full,
      backgroundColor: colors.glassBorder,
      marginBottom: spacing.xs,
    },
    product: {
      flexDirection: "row",
      gap: spacing.md,
      alignItems: "center",
    },
    thumb: {
      width: 88,
      height: 88,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
    },
    thumbEmpty: {
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    copy: {
      flex: 1,
      gap: 4,
    },
    merchant: {
      ...type.label,
      color: colors.textMuted,
      textTransform: "uppercase",
    },
    title: {
      ...type.subtitle,
      color: colors.text,
      fontWeight: "700",
    },
    price: {
      ...type.caption,
      color: colors.text,
      fontWeight: "700",
    },
    actions: {
      gap: spacing.sm,
    },
  });
}
