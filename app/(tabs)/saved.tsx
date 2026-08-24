// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { ScreenShell } from "../../components/ScreenShell";
import { useTheme } from "../../components/ThemeProvider";
import {
  radii,
  shadows,
  spacing,
  type,
  type ThemeColors,
} from "../../components/theme";
import { lightImpact } from "../../lib/haptics";
import {
  collectionTitle,
  coverUri,
  listCollections,
  looksLabel,
} from "../../lib/looks";

export default function SavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [collections, setCollections] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listCollections()
        .then((items) => {
          if (active) setCollections(items);
        })
        .catch(() => {
          if (active) setCollections([]);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  if (collections.length === 0) {
    return (
      <ScreenShell contentStyle={{ paddingTop: insets.top + spacing.lg }}>
        <EmptyState
          icon="bookmark-outline"
          title="Nothing saved yet"
          description="Save a try-on from Reveal to start a look you can build on later."
          actionLabel="Start scanning"
          onAction={() => router.push("/(tabs)/camera")}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell contentStyle={{ paddingTop: insets.top + spacing.lg }}>
      <ScreenHeader
        title="Saved"
        subtitle="Looks you can reopen and add to."
      />
      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const cover = coverUri(item);
          return (
            <Pressable
              onPress={() => {
                lightImpact();
                router.push(`/look/${item.id}`);
              }}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.pressed,
              ]}
            >
              {cover ? (
                <Image
                  source={{ uri: cover }}
                  style={styles.cover}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.cover, styles.coverEmpty]} />
              )}
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {collectionTitle(item)}
                </Text>
                <Text style={styles.cardMeta}>
                  {looksLabel(item.steps.length)}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textDim}
                style={styles.chevron}
              />
            </Pressable>
          );
        }}
      />
    </ScreenShell>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    list: {
      gap: spacing.md,
      paddingBottom: spacing.xl,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: radii.xl,
      overflow: "hidden",
      ...shadows.card,
    },
    cover: {
      width: 92,
      height: 118,
      backgroundColor: colors.surface,
    },
    coverEmpty: {
      backgroundColor: colors.surfaceRaised,
    },
    cardBody: {
      flex: 1,
      padding: spacing.md,
      justifyContent: "center",
      gap: spacing.xs,
    },
    cardTitle: {
      ...type.subtitle,
      color: colors.text,
    },
    cardMeta: {
      ...type.caption,
      color: colors.textMuted,
    },
    chevron: {
      marginRight: spacing.md,
    },
    pressed: {
      opacity: 0.9,
    },
  });
}
