// @ts-nocheck
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BeforeAfterSlider } from "../../components/BeforeAfterSlider";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useTheme } from "../../components/ThemeProvider";
import { spacing, type, type ThemeColors } from "../../components/theme";
import { lightImpact } from "../../lib/haptics";
import {
  deleteCollection,
  getCollection,
  looksLabel,
} from "../../lib/looks";
import { openExternalUrl } from "../../lib/openUrl";
import { session } from "../../lib/session";

const PAGE_WIDTH = Dimensions.get("window").width;

export default function LookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const listRef = useRef(null);
  const [collection, setCollection] = useState(null);
  const [index, setIndex] = useState(0);
  const [missing, setMissing] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    getCollection(id)
      .then((item) => {
        if (!item) {
          setMissing(true);
          setCollection(null);
          return;
        }
        setMissing(false);
        setCollection(item);
        setIndex((current) =>
          Math.min(current, Math.max(0, item.steps.length - 1)),
        );
      })
      .catch(() => setMissing(true));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const step = collection?.steps[index];

  function addItem() {
    if (!collection) return;
    const last = collection.steps[collection.steps.length - 1];
    if (!last?.resultImageUri) return;
    lightImpact();
    session.continueCollectionId = collection.id;
    session.continueBaseImageUri = last.resultImageUri;
    router.push("/(tabs)/camera");
  }

  function confirmDelete() {
    Alert.alert(
      "Delete look?",
      "This removes the saved collection from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              await deleteCollection(id);
              router.replace("/(tabs)/saved");
            })();
          },
        },
      ],
    );
  }

  if (missing) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.error}>This look is no longer saved.</Text>
        <PrimaryButton
          icon="bookmark-outline"
          variant="secondary"
          label="Back to Saved"
          onPress={() => router.replace("/(tabs)/saved")}
        />
      </View>
    );
  }

  if (!collection || !step) {
    return <View style={styles.screen} />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.media}>
        <FlatList
          ref={listRef}
          data={collection.steps}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          style={styles.pager}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const next = Math.round(
              event.nativeEvent.contentOffset.x / PAGE_WIDTH,
            );
            setIndex(next);
          }}
          renderItem={({ item }) => (
            <View style={{ width: PAGE_WIDTH, flex: 1 }}>
              {item.baseImageUri ? (
                <BeforeAfterSlider
                  beforeUri={item.baseImageUri}
                  afterUri={item.resultImageUri}
                  fill
                  style={styles.slider}
                />
              ) : (
                <Image
                  source={{ uri: item.resultImageUri }}
                  style={styles.image}
                  resizeMode="contain"
                />
              )}
            </View>
          )}
        />
      </View>

      <View
        style={[
          styles.dock,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <Text style={styles.title} numberOfLines={2}>
          {step.productTitle || "Saved look"}
        </Text>
        <Text style={styles.meta}>
          {looksLabel(collection.steps.length)} · {index + 1} of{" "}
          {collection.steps.length}
        </Text>
        {collection.steps.length > 1 ? (
          <View style={styles.dots}>
            {collection.steps.map((item, i) => (
              <View
                key={item.id}
                style={[styles.dot, i === index && styles.dotActive]}
              />
            ))}
          </View>
        ) : null}
        <View style={styles.actions}>
          <PrimaryButton
            icon="add-outline"
            compact
            label="Add"
            onPress={addItem}
            style={styles.actionBtn}
          />
          {step.shopUrl ? (
            <PrimaryButton
              icon="bag-outline"
              variant="inverse"
              compact
              label="Shop"
              onPress={() => {
                lightImpact();
                openExternalUrl(step.shopUrl);
              }}
              style={styles.actionBtn}
            />
          ) : null}
          <PrimaryButton
            icon="trash-outline"
            variant="secondary"
            compact
            label="Delete"
            onPress={confirmDelete}
            style={styles.actionBtn}
          />
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    media: {
      flex: 1,
    },
    pager: {
      flex: 1,
    },
    slider: {
      flex: 1,
    },
    image: {
      flex: 1,
      width: "100%",
      backgroundColor: colors.canvas,
    },
    dock: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      backgroundColor: colors.canvas,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.glassBorder,
      gap: spacing.xs,
    },
    title: {
      ...type.subtitle,
      color: colors.text,
    },
    meta: {
      ...type.caption,
      color: colors.textMuted,
    },
    dots: {
      flexDirection: "row",
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.glassBorder,
    },
    dotActive: {
      backgroundColor: colors.accent,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    actionBtn: {
      flex: 1,
      minWidth: 0,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.canvas,
      padding: spacing.xl,
      gap: spacing.lg,
    },
    error: {
      ...type.body,
      color: colors.error,
      textAlign: "center",
    },
  });
}
